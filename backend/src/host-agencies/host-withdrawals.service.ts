import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { HostEconomySettingsService } from "./host-economy-settings.service";
import { CreateHostWithdrawalDto } from "./dto/create-host-withdrawal.dto";
import { CreateAgencyWithdrawalDto } from "./dto/create-agency-withdrawal.dto";
import { ReviewRequestDto } from "./dto/review-request.dto";

@Injectable()
export class HostWithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallet: WalletService,
    private readonly settings: HostEconomySettingsService,
  ) {}

  async createHostWithdrawal(hostId: string, dto: CreateHostWithdrawalDto) {
    const settings = await this.settings.getSettings();
    const usdAmount = round2(dto.diamondsAmount * Number(settings.diamondToUsdRate));

    const request = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitDiamond(hostId, dto.diamondsAmount, tx);
      return tx.hostWithdrawalRequest.create({
        data: {
          hostId,
          diamondsAmount: dto.diamondsAmount,
          usdAmount,
          method: dto.method,
          accountNumber: dto.accountNumber,
          notes: dto.notes,
        },
      });
    });

    await this.notifications.send(
      hostId,
      "WITHDRAWAL_REQUESTED",
      "تم إرسال طلب الفك",
      `تم إرسال طلب فك ${dto.diamondsAmount} ألماسة (${usdAmount}$) وهو الآن قيد المراجعة.`,
      { requestId: request.id },
    );

    return request;
  }

  listMyHostWithdrawals(hostId: string) {
    return this.prisma.hostWithdrawalRequest.findMany({ where: { hostId }, orderBy: { createdAt: "desc" } });
  }

  listHostWithdrawals(status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") {
    return this.prisma.hostWithdrawalRequest.findMany({
      where: { status },
      include: { host: { select: { id: true, username: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewHostWithdrawal(requestId: string, reviewerId: string, dto: ReviewRequestDto) {
    const request = await this.prisma.hostWithdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Withdrawal request not found");
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException("Request has already been reviewed");
    }

    if (dto.approve) {
      await this.prisma.hostWithdrawalRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.hostWithdrawalRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
        }),
        this.prisma.userWallet.update({
          where: { userId: request.hostId },
          data: { diamondBalance: { increment: request.diamondsAmount } },
        }),
      ]);
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: dto.approve ? "host_withdrawal.approved" : "host_withdrawal.rejected",
        entityType: "HostWithdrawalRequest",
        entityId: requestId,
      },
    });

    await this.notifications.send(
      request.hostId,
      dto.approve ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
      dto.approve ? "تمت الموافقة على طلب الفك" : "تم رفض طلب الفك",
      dto.approve
        ? `تمت الموافقة على فك ${request.diamondsAmount} ألماسة (${request.usdAmount}$).`
        : dto.notes ?? "تم رفض طلب الفك وإعادة الألماس إلى رصيدك.",
      { requestId },
    );

    return this.prisma.hostWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  async createAgencyWithdrawal(agencyId: string, requesterId: string, dto: CreateAgencyWithdrawalDto) {
    const agency = await this.prisma.hostAgency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException("Host agency not found");
    }
    if (agency.ownerId !== requesterId) {
      throw new ForbiddenException("Only the agency owner can withdraw its commission balance");
    }
    if (Number(agency.commissionBalance) < dto.usdAmount) {
      throw new BadRequestException("Insufficient commission balance for withdrawal");
    }

    const request = await this.prisma.$transaction(async (tx) => {
      await tx.hostAgency.update({
        where: { id: agencyId },
        data: { commissionBalance: { decrement: dto.usdAmount } },
      });
      return tx.agencyWithdrawalRequest.create({
        data: {
          agencyId,
          usdAmount: dto.usdAmount,
          method: dto.method,
          accountNumber: dto.accountNumber,
          notes: dto.notes,
        },
      });
    });

    await this.notifications.send(
      requesterId,
      "WITHDRAWAL_REQUESTED",
      "تم إرسال طلب سحب عمولة الوكالة",
      `تم إرسال طلب سحب ${dto.usdAmount}$ من رصيد عمولة الوكالة وهو الآن قيد المراجعة.`,
      { requestId: request.id },
    );

    return request;
  }

  listMyAgencyWithdrawals(agencyId: string, requesterId: string) {
    return this.assertOwnerThen(agencyId, requesterId, () =>
      this.prisma.agencyWithdrawalRequest.findMany({ where: { agencyId }, orderBy: { createdAt: "desc" } }),
    );
  }

  listAgencyWithdrawals(status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") {
    return this.prisma.agencyWithdrawalRequest.findMany({
      where: { status },
      include: { agency: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewAgencyWithdrawal(requestId: string, reviewerId: string, dto: ReviewRequestDto) {
    const request = await this.prisma.agencyWithdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Withdrawal request not found");
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException("Request has already been reviewed");
    }

    if (dto.approve) {
      await this.prisma.agencyWithdrawalRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.agencyWithdrawalRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED", reviewedById: reviewerId, reviewNotes: dto.notes, reviewedAt: new Date() },
        }),
        this.prisma.hostAgency.update({
          where: { id: request.agencyId },
          data: { commissionBalance: { increment: request.usdAmount } },
        }),
      ]);
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: dto.approve ? "agency_withdrawal.approved" : "agency_withdrawal.rejected",
        entityType: "AgencyWithdrawalRequest",
        entityId: requestId,
      },
    });

    return this.prisma.agencyWithdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  private async assertOwnerThen<T>(agencyId: string, requesterId: string, fn: () => Promise<T>): Promise<T> {
    const agency = await this.prisma.hostAgency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException("Host agency not found");
    }
    if (agency.ownerId !== requesterId) {
      throw new ForbiddenException("Only the agency owner can view this");
    }
    return fn();
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
