import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HostAgentWithdrawalStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { HostEconomySettingsService } from "../host-agencies/host-economy-settings.service";
import { CreateHostAgentWithdrawalDto } from "./dto/create-host-agent-withdrawal.dto";
import { SubmitPaymentProofDto } from "./dto/submit-payment-proof.dto";
import { RejectHostAgentWithdrawalDto } from "./dto/reject-host-agent-withdrawal.dto";

const ACCEPTANCE_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class HostAgentWithdrawalsService {
  private readonly logger = new Logger(HostAgentWithdrawalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallet: WalletService,
    private readonly settings: HostEconomySettingsService,
  ) {}

  async listAvailableAgents() {
    const agents = await this.prisma.rechargeAgent.findMany({
      where: { status: "ACTIVE", agency: { status: "ACTIVE" } },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        agency: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return agents.map((agent) => ({
      id: agent.id,
      user: agent.user,
      agencyName: agent.agency.name,
    }));
  }

  async createRequest(hostId: string, dto: CreateHostAgentWithdrawalDto) {
    const agent = await this.prisma.rechargeAgent.findUnique({
      where: { id: dto.rechargeAgentId },
      include: { agency: true },
    });
    if (!agent || agent.status !== "ACTIVE" || agent.agency.status !== "ACTIVE") {
      throw new NotFoundException("Recharge agent not found or unavailable");
    }

    const economySettings = await this.settings.getSettings();
    const usdAmount = round2(dto.diamondsAmount * Number(economySettings.diamondToUsdRate));

    const request = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitDiamond(hostId, dto.diamondsAmount, tx);
      return tx.hostAgentWithdrawalRequest.create({
        data: {
          hostId,
          rechargeAgentId: agent.id,
          diamondsAmount: dto.diamondsAmount,
          usdAmount,
          payoutMethod: dto.payoutMethod,
          payoutAccount: dto.payoutAccount,
        },
      });
    });

    await this.notifications.send(
      agent.userId,
      "AGENT_WITHDRAWAL_REQUESTED",
      "طلب سحب جديد",
      `طلب مضيف سحب ${dto.diamondsAmount} ألماسة (${usdAmount}$) عبرك.`,
      { requestId: request.id },
    );

    return request;
  }

  listMyRequests(hostId: string) {
    return this.prisma.hostAgentWithdrawalRequest.findMany({
      where: { hostId },
      include: { rechargeAgent: { include: { user: { select: { id: true, username: true, fullName: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelRequest(hostId: string, requestId: string) {
    const request = await this.getOwnedByHostOrThrow(hostId, requestId);

    await this.prisma.$transaction(async (tx) => {
      await this.transitionOrThrow(tx, requestId, ["PENDING"], { status: "CANCELLED" });
      await this.wallet.creditDiamond(hostId, Number(request.diamondsAmount), tx);
    });

    return this.prisma.hostAgentWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  async confirmReceipt(hostId: string, requestId: string) {
    const request = await this.getOwnedByHostOrThrow(hostId, requestId);

    await this.settle(request.id, request.rechargeAgentId, Number(request.diamondsAmount));

    await this.notifications.send(
      (await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: request.rechargeAgentId } })).userId,
      "AGENT_WITHDRAWAL_COMPLETED",
      "تم تأكيد الاستلام",
      `أكّد المضيف استلام المبلغ. تم تحويل ${request.diamondsAmount} ألماسة إلى رصيدك.`,
      { requestId },
    );

    return this.prisma.hostAgentWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  listAgentInbox(rechargeAgentId: string, status?: HostAgentWithdrawalStatus) {
    return this.prisma.hostAgentWithdrawalRequest.findMany({
      where: { rechargeAgentId, ...(status ? { status } : {}) },
      include: { host: { select: { id: true, username: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptRequest(rechargeAgentId: string, requestId: string) {
    const request = await this.getOwnedByAgentOrThrow(rechargeAgentId, requestId);

    const now = new Date();
    await this.transitionOrThrow(this.prisma, requestId, ["PENDING"], {
      status: "ACCEPTED",
      acceptedAt: now,
      expiresAt: new Date(now.getTime() + ACCEPTANCE_WINDOW_MS),
    });

    await this.notifications.send(
      request.hostId,
      "AGENT_WITHDRAWAL_ACCEPTED",
      "قبل الوكيل طلب السحب",
      `قبل وكيل الشحن طلب سحب ${request.diamondsAmount} ألماسة. بانتظار تحويل المبلغ خلال 24 ساعة.`,
      { requestId },
    );

    return this.prisma.hostAgentWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  async rejectRequest(rechargeAgentId: string, requestId: string, dto: RejectHostAgentWithdrawalDto) {
    const request = await this.getOwnedByAgentOrThrow(rechargeAgentId, requestId);

    await this.prisma.$transaction(async (tx) => {
      await this.transitionOrThrow(tx, requestId, ["PENDING"], { status: "REJECTED", rejectionReason: dto.reason });
      await this.wallet.creditDiamond(request.hostId, Number(request.diamondsAmount), tx);
    });

    await this.notifications.send(
      request.hostId,
      "AGENT_WITHDRAWAL_REJECTED",
      "رفض الوكيل طلب السحب",
      dto.reason ?? "رفض وكيل الشحن طلب السحب وتم إرجاع الألماس إلى رصيدك.",
      { requestId },
    );

    return this.prisma.hostAgentWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  async submitProof(rechargeAgentId: string, requestId: string, dto: SubmitPaymentProofDto) {
    const request = await this.getOwnedByAgentOrThrow(rechargeAgentId, requestId);

    await this.transitionOrThrow(this.prisma, requestId, ["ACCEPTED"], {
      status: "PAID",
      proofUrl: dto.proofUrl,
      paymentReference: dto.paymentReference,
      paidAt: new Date(),
    });

    await this.notifications.send(
      request.hostId,
      "AGENT_WITHDRAWAL_PAID",
      "أرسل الوكيل إثبات الدفع",
      "رفع وكيل الشحن إثبات تحويل المبلغ. إذا استلمت المبلغ اضغط \"تم الاستلام\".",
      { requestId },
    );

    return this.prisma.hostAgentWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async resolveExpiredRequests() {
    const expired = await this.prisma.hostAgentWithdrawalRequest.findMany({
      where: { status: { in: ["ACCEPTED", "PAID"] }, expiresAt: { lte: new Date() } },
    });

    for (const request of expired) {
      try {
        if (request.status === "PAID") {
          await this.settle(request.id, request.rechargeAgentId, Number(request.diamondsAmount));
          await this.notifications.send(
            request.hostId,
            "AGENT_WITHDRAWAL_COMPLETED",
            "تم تحويل الماسات تلقائيًا",
            "لم يتم التأكيد خلال المهلة المحددة، وتم تحويل الماسات تلقائيًا إلى وكيل الشحن نظرًا لوجود إثبات دفع.",
            { requestId: request.id },
          );
        } else {
          await this.prisma.$transaction(async (tx) => {
            await this.transitionOrThrow(tx, request.id, ["ACCEPTED"], { status: "REFUNDED" });
            await this.wallet.creditDiamond(request.hostId, Number(request.diamondsAmount), tx);
          });
          await this.notifications.send(
            request.hostId,
            "AGENT_WITHDRAWAL_REFUNDED",
            "تم إرجاع الماسات تلقائيًا",
            "لم يرفع وكيل الشحن أي إثبات دفع خلال المهلة المحددة، وتم إرجاع الألماس إلى رصيدك.",
            { requestId: request.id },
          );
        }
      } catch (error) {
        this.logger.error(`Failed to auto-resolve request ${request.id}`, error as Error);
      }
    }
  }

  private async settle(requestId: string, rechargeAgentId: string, diamondsAmount: number) {
    await this.prisma.$transaction(async (tx) => {
      await this.transitionOrThrow(tx, requestId, ["PAID"], { status: "COMPLETED", completedAt: new Date() });
      await tx.rechargeAgent.update({
        where: { id: rechargeAgentId },
        data: { diamondBalance: { increment: diamondsAmount } },
      });
    });
  }

  // updateMany + count check (not a plain update) so a concurrent racer sees count 0 and throws instead of re-applying the diamond credit.
  private async transitionOrThrow(
    tx: Prisma.TransactionClient,
    requestId: string,
    fromStatuses: HostAgentWithdrawalStatus[],
    data: Prisma.HostAgentWithdrawalRequestUpdateManyMutationInput,
  ) {
    const result = await tx.hostAgentWithdrawalRequest.updateMany({
      where: { id: requestId, status: { in: fromStatuses } },
      data,
    });
    if (result.count === 0) {
      throw new BadRequestException("This request's status has already changed");
    }
  }

  private async getOwnedByHostOrThrow(hostId: string, requestId: string) {
    const request = await this.prisma.hostAgentWithdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Withdrawal request not found");
    }
    if (request.hostId !== hostId) {
      throw new ForbiddenException("This request does not belong to you");
    }
    return request;
  }

  private async getOwnedByAgentOrThrow(rechargeAgentId: string, requestId: string) {
    const request = await this.prisma.hostAgentWithdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Withdrawal request not found");
    }
    if (request.rechargeAgentId !== rechargeAgentId) {
      throw new ForbiddenException("This request was not sent to you");
    }
    return request;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
