import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RechargeSettingsService } from "./recharge-settings.service";
import { CreateTopUpRequestDto } from "./dto/create-topup-request.dto";
import { ReviewRequestDto } from "./dto/review-request.dto";
import { ManualCreditDto } from "./dto/manual-credit.dto";
import { CreateWithdrawalRequestDto } from "./dto/create-withdrawal-request.dto";

@Injectable()
export class RechargeWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly settings: RechargeSettingsService,
  ) {}

  async getWallet(agentId: string) {
    const wallet = await this.prisma.rechargeWallet.findUnique({ where: { agentId } });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }
    return wallet;
  }

  async createTopUpRequest(agentId: string, dto: CreateTopUpRequestDto) {
    const request = await this.prisma.topUpRequest.create({
      data: { agentId, amount: dto.amount, paymentMethod: dto.paymentMethod, proofUrl: dto.proofUrl },
    });

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: agentId } });
    await this.notifications.send(
      agent.userId,
      "TOPUP_REQUEST_SUBMITTED",
      "تم إرسال طلب تعبئة الرصيد",
      `تم إرسال طلب تعبئة بمبلغ ${dto.amount} وهو الآن قيد المراجعة.`,
      { requestId: request.id },
    );

    return request;
  }

  async listTopUpRequests(agentId?: string, status?: "PENDING" | "APPROVED" | "REJECTED") {
    return this.prisma.topUpRequest.findMany({
      where: { agentId, status },
      include: { agent: { include: { user: { select: { id: true, username: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewTopUpRequest(requestId: string, reviewerId: string, dto: ReviewRequestDto) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Top-up request not found");
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException("Request has already been reviewed");
    }

    if (dto.approve) {
      await this.prisma.$transaction([
        this.prisma.topUpRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
        }),
        this.prisma.rechargeWallet.update({
          where: { agentId: request.agentId },
          data: { balance: { increment: request.amount } },
        }),
      ]);
    } else {
      await this.prisma.topUpRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: dto.approve ? "topup.approved" : "topup.rejected",
        entityType: "TopUpRequest",
        entityId: requestId,
        metadata: { amount: request.amount.toString() },
      },
    });

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: request.agentId } });
    await this.notifications.send(
      agent.userId,
      dto.approve ? "TOPUP_REQUEST_APPROVED" : "TOPUP_REQUEST_REJECTED",
      dto.approve ? "تمت الموافقة على تعبئة الرصيد" : "تم رفض طلب تعبئة الرصيد",
      dto.approve
        ? `تمت إضافة ${request.amount} إلى رصيدك.`
        : dto.notes ?? "تم رفض طلب تعبئة الرصيد.",
      { requestId },
    );

    return this.prisma.topUpRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  async manualCredit(agentId: string, actorId: string, dto: ManualCreditDto) {
    const wallet = await this.prisma.rechargeWallet.update({
      where: { agentId },
      data: { balance: { increment: dto.amount } },
    });

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: agentId } });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "wallet.manual_credit",
        entityType: "RechargeWallet",
        entityId: wallet.id,
        metadata: { amount: dto.amount, notes: dto.notes },
      },
    });

    await this.notifications.send(
      agent.userId,
      "WALLET_CREDITED",
      "تمت تعبئة رصيدك",
      `تمت إضافة ${dto.amount} إلى رصيد وكالتك من قبل الإدارة.`,
      { amount: dto.amount },
    );

    return wallet;
  }

  async createWithdrawalRequest(agentId: string, dto: CreateWithdrawalRequestDto) {
    const settings = await this.settings.getSettings();
    const wallet = await this.getWallet(agentId);

    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException("Insufficient balance for withdrawal");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const withdrawnToday = await this.prisma.withdrawalRequest.aggregate({
      where: { agentId, createdAt: { gte: startOfDay }, status: { in: ["PENDING", "APPROVED", "COMPLETED"] } },
      _sum: { amount: true },
    });
    const totalToday = Number(withdrawnToday._sum.amount ?? 0) + dto.amount;
    if (totalToday > Number(settings.dailyWithdrawLimit)) {
      throw new BadRequestException("Daily withdrawal limit exceeded");
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.create({
        data: {
          agentId,
          amount: dto.amount,
          method: dto.method,
          accountNumber: dto.accountNumber,
          notes: dto.notes,
        },
      }),
      this.prisma.rechargeWallet.update({
        where: { agentId },
        data: { balance: { decrement: dto.amount }, frozenBalance: { increment: dto.amount } },
      }),
    ]);

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: agentId } });
    await this.notifications.send(
      agent.userId,
      "WITHDRAWAL_REQUESTED",
      "تم إرسال طلب السحب",
      `تم إرسال طلب سحب بمبلغ ${dto.amount} وهو الآن قيد المراجعة.`,
      { requestId: request.id },
    );

    return request;
  }

  async listWithdrawalRequests(agentId?: string, status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") {
    return this.prisma.withdrawalRequest.findMany({
      where: { agentId, status },
      include: { agent: { include: { user: { select: { id: true, username: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewWithdrawalRequest(requestId: string, reviewerId: string, dto: ReviewRequestDto) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Withdrawal request not found");
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException("Request has already been reviewed");
    }

    if (dto.approve) {
      await this.prisma.$transaction([
        this.prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: "COMPLETED",
            reviewedById: reviewerId,
            reviewNotes: dto.notes,
            reviewedAt: new Date(),
          },
        }),
        this.prisma.rechargeWallet.update({
          where: { agentId: request.agentId },
          data: { frozenBalance: { decrement: request.amount } },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            reviewedById: reviewerId,
            reviewNotes: dto.notes,
            reviewedAt: new Date(),
          },
        }),
        this.prisma.rechargeWallet.update({
          where: { agentId: request.agentId },
          data: {
            frozenBalance: { decrement: request.amount },
            balance: { increment: request.amount },
          },
        }),
      ]);
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: dto.approve ? "withdrawal.approved" : "withdrawal.rejected",
        entityType: "WithdrawalRequest",
        entityId: requestId,
      },
    });

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({ where: { id: request.agentId } });
    await this.notifications.send(
      agent.userId,
      dto.approve ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
      dto.approve ? "تمت الموافقة على طلب السحب" : "تم رفض طلب السحب",
      dto.approve
        ? `تمت الموافقة على سحب ${request.amount}.`
        : dto.notes ?? "تم رفض طلب السحب وإعادة المبلغ إلى رصيدك.",
      { requestId },
    );

    return this.prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }
}
