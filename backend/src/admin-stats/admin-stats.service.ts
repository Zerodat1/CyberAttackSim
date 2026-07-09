import { Injectable } from "@nestjs/common";
import { GlobalRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      newUsersLast7Days,
      applicationsByStatus,
      agenciesByStatus,
      topUpsByStatus,
      completedTopUpsSum,
      withdrawalsByStatus,
      completedWithdrawalsSum,
      platformRevenueSum,
      totalRooms,
      activeRooms,
      totalRoomMembers,
      totalGiftSends,
      giftSendsLast7Days,
      giftGoldSpentSum,
      totalGameRounds,
      gameRoundsByType,
      gameAmountsSum,
      totalHostAgencies,
      activeHostAgencies,
      totalHostAgencyMembers,
      walletTotals,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({ by: ["globalRole"], _count: true }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.rechargeAgencyApplication.groupBy({ by: ["status"], _count: true }),
      this.prisma.rechargeAgency.groupBy({ by: ["status"], _count: true }),
      this.prisma.topUpRequest.groupBy({ by: ["status"], _count: true }),
      this.prisma.topUpRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.groupBy({ by: ["status"], _count: true }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.prisma.rechargeTransaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { platformShare: true },
      }),
      this.prisma.room.count(),
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.roomMember.count(),
      this.prisma.giftSend.count(),
      this.prisma.giftSend.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.giftSend.aggregate({ _sum: { totalGoldCost: true } }),
      this.prisma.gameRound.count(),
      this.prisma.gameRound.groupBy({ by: ["gameType"], _count: true }),
      this.prisma.gameRound.aggregate({ _sum: { betAmount: true, payout: true } }),
      this.prisma.hostAgency.count(),
      this.prisma.hostAgency.count({ where: { isActive: true } }),
      this.prisma.hostAgencyMember.count(),
      this.prisma.userWallet.aggregate({ _sum: { goldBalance: true, diamondBalance: true } }),
    ]);

    const winsByType = await this.prisma.gameRound.groupBy({
      by: ["gameType"],
      where: { isWin: true },
      _count: true,
    });
    const winsMap = new Map(winsByType.map((row) => [row.gameType, row._count]));

    const roleCounts = Object.fromEntries(
      Object.values(GlobalRole).map((role) => [role, 0]),
    ) as Record<GlobalRole, number>;
    for (const row of usersByRole) {
      roleCounts[row.globalRole] = row._count;
    }

    const statusCounts = <T extends string>(
      rows: { status: T; _count: number }[],
    ): Record<string, number> => Object.fromEntries(rows.map((row) => [row.status, row._count]));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newLast7Days: newUsersLast7Days,
        byRole: roleCounts,
      },
      rechargeApplications: statusCounts(applicationsByStatus),
      rechargeAgencies: statusCounts(agenciesByStatus),
      topUpRequests: {
        byStatus: statusCounts(topUpsByStatus),
        completedTotalAmount: completedTopUpsSum._sum.amount ?? 0,
      },
      withdrawalRequests: {
        byStatus: statusCounts(withdrawalsByStatus),
        completedTotalAmount: completedWithdrawalsSum._sum.amount ?? 0,
      },
      platformRevenue: {
        totalPlatformShare: platformRevenueSum._sum.platformShare ?? 0,
      },
      rooms: {
        total: totalRooms,
        active: activeRooms,
        totalMemberships: totalRoomMembers,
      },
      gifts: {
        totalSends: totalGiftSends,
        sendsLast7Days: giftSendsLast7Days,
        totalGoldSpent: giftGoldSpentSum._sum.totalGoldCost ?? 0,
      },
      games: {
        totalRounds: totalGameRounds,
        totalBetAmount: gameAmountsSum._sum.betAmount ?? 0,
        totalPayout: gameAmountsSum._sum.payout ?? 0,
        byType: gameRoundsByType.map((row) => ({
          gameType: row.gameType,
          rounds: row._count,
          wins: winsMap.get(row.gameType) ?? 0,
        })),
      },
      hostAgencies: {
        total: totalHostAgencies,
        active: activeHostAgencies,
        totalMembers: totalHostAgencyMembers,
      },
      wallet: {
        totalGold: walletTotals._sum.goldBalance ?? 0,
        totalDiamonds: walletTotals._sum.diamondBalance ?? 0,
      },
    };
  }
}
