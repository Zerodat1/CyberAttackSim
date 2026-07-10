import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HostEconomySettingsService } from "./host-economy-settings.service";
import { HostTargetTiersService } from "./host-target-tiers.service";
import { currentMonthKey, startOfDay, startOfMonth } from "./utils/month-key";

@Injectable()
export class HostEarningsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: HostEconomySettingsService,
    private readonly tiers: HostTargetTiersService,
  ) {}

  async recordGiftEarnings(
    recipientId: string,
    diamondsAwarded: number,
    giftSendId: string,
    tx: Prisma.TransactionClient,
  ) {
    const member = await tx.hostAgencyMember.findUnique({ where: { userId: recipientId } });
    if (!member) {
      return;
    }

    const monthKey = currentMonthKey();

    const memberMonthlyDiamonds =
      member.monthKey === monthKey ? Number(member.monthlyDiamonds) + diamondsAwarded : diamondsAwarded;

    await tx.hostAgencyMember.update({
      where: { userId: recipientId },
      data: {
        monthlyDiamonds: memberMonthlyDiamonds,
        lifetimeDiamonds: { increment: diamondsAwarded },
        monthKey,
      },
    });

    const agency = await tx.hostAgency.findUniqueOrThrow({ where: { id: member.agencyId } });
    const agencyMonthlyDiamonds =
      agency.monthKey === monthKey ? Number(agency.monthlyDiamonds) + diamondsAwarded : diamondsAwarded;

    const economySettings = await this.settings.getSettings();
    const effectiveRate = this.effectiveCommissionRate(agency, agencyMonthlyDiamonds, economySettings);

    const commissionUsd = round2(
      diamondsAwarded * (effectiveRate / 100) * Number(economySettings.diamondToUsdRate),
    );

    await tx.hostAgency.update({
      where: { id: agency.id },
      data: {
        monthlyDiamonds: agencyMonthlyDiamonds,
        monthKey,
        commissionBalance: { increment: commissionUsd },
      },
    });

    await tx.hostAgencyCommissionEntry.create({
      data: {
        agencyId: agency.id,
        hostId: recipientId,
        giftSendId,
        diamondsAwarded,
        commissionRate: effectiveRate,
        commissionUsd,
      },
    });
  }

  async getHostDashboard(userId: string) {
    const member = await this.prisma.hostAgencyMember.findUnique({
      where: { userId },
      include: { agency: { select: { id: true, name: true } } },
    });
    if (!member) {
      return null;
    }

    const monthKey = currentMonthKey();
    const monthlyDiamonds = member.monthKey === monthKey ? Number(member.monthlyDiamonds) : 0;

    const [wallet, giftsAggregate, withdrawals, settings, progress] = await Promise.all([
      this.prisma.userWallet.findUnique({ where: { userId } }),
      this.prisma.giftSend.aggregate({ where: { recipientId: userId }, _sum: { totalGoldCost: true } }),
      this.prisma.hostWithdrawalRequest.findMany({
        where: { hostId: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.settings.getSettings(),
      this.tiers.computeProgress(monthlyDiamonds),
    ]);

    const diamondBalance = Number(wallet?.diamondBalance ?? 0);

    return {
      agency: member.agency,
      lifetimeDiamonds: Number(member.lifetimeDiamonds),
      totalGoldReceived: Number(giftsAggregate._sum.totalGoldCost ?? 0),
      monthlyDiamonds,
      currentTier: progress.currentTier,
      nextTier: progress.nextTier,
      progressPercent: progress.progressPercent,
      expectedMonthlySalaryUsd: progress.currentTier?.salaryUsd ?? 0,
      withdrawableDiamonds: diamondBalance,
      withdrawableUsd: round2(diamondBalance * Number(settings.diamondToUsdRate)),
      diamondToUsdRate: Number(settings.diamondToUsdRate),
      withdrawalHistory: withdrawals,
    };
  }

  async getAgencyDashboard(agencyId: string) {
    const agency = await this.prisma.hostAgency.findUniqueOrThrow({
      where: { id: agencyId },
      include: {
        members: { include: { user: { select: { id: true, username: true, fullName: true, avatarUrl: true } } } },
      },
    });

    const monthKey = currentMonthKey();
    const agencyMonthlyDiamonds = agency.monthKey === monthKey ? Number(agency.monthlyDiamonds) : 0;
    const settings = await this.settings.getSettings();
    const effectiveRate = this.effectiveCommissionRate(agency, agencyMonthlyDiamonds, settings);

    const [dailyProfit, monthlyProfit, withdrawals] = await Promise.all([
      this.prisma.hostAgencyCommissionEntry.aggregate({
        where: { agencyId, createdAt: { gte: startOfDay() } },
        _sum: { commissionUsd: true },
      }),
      this.prisma.hostAgencyCommissionEntry.aggregate({
        where: { agencyId, createdAt: { gte: startOfMonth() } },
        _sum: { commissionUsd: true },
      }),
      this.prisma.agencyWithdrawalRequest.findMany({ where: { agencyId }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);

    const hosts = await Promise.all(
      agency.members.map(async (m) => {
        const memberMonthlyDiamonds = m.monthKey === monthKey ? Number(m.monthlyDiamonds) : 0;
        const progress = await this.tiers.computeProgress(memberMonthlyDiamonds);
        return {
          userId: m.user.id,
          username: m.user.username,
          fullName: m.user.fullName,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
          monthlyDiamonds: memberMonthlyDiamonds,
          lifetimeDiamonds: Number(m.lifetimeDiamonds),
          currentTierSalaryUsd: progress.currentTier?.salaryUsd ?? 0,
        };
      }),
    );

    return {
      agencyId: agency.id,
      name: agency.name,
      isPremium: agency.isPremium,
      monthlyTargetDiamonds: agency.monthlyTargetDiamonds ? Number(agency.monthlyTargetDiamonds) : null,
      monthlyDiamonds: agencyMonthlyDiamonds,
      effectiveCommissionRate: effectiveRate,
      commissionBalance: Number(agency.commissionBalance),
      dailyProfitUsd: Number(dailyProfit._sum.commissionUsd ?? 0),
      monthlyProfitUsd: Number(monthlyProfit._sum.commissionUsd ?? 0),
      hostsCount: hosts.length,
      hosts,
      withdrawalHistory: withdrawals,
    };
  }

  private effectiveCommissionRate(
    agency: { isPremium: boolean; monthlyTargetDiamonds: Prisma.Decimal | null },
    agencyMonthlyDiamonds: number,
    settings: { agencyPremiumRate: Prisma.Decimal; agencyTargetRate: Prisma.Decimal; agencyBaseRate: Prisma.Decimal },
  ): number {
    if (agency.isPremium) {
      return Number(settings.agencyPremiumRate);
    }
    if (agency.monthlyTargetDiamonds && agencyMonthlyDiamonds >= Number(agency.monthlyTargetDiamonds)) {
      return Number(settings.agencyTargetRate);
    }
    return Number(settings.agencyBaseRate);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
