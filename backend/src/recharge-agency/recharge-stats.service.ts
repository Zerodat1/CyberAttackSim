import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RechargeStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentDashboard(agentId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [agent, wallet, dailyAgg, weeklyAgg, monthlyAgg, allTimeAgg, distinctCustomers, pendingWithdrawals] =
      await Promise.all([
        this.prisma.rechargeAgent.findUnique({ where: { id: agentId }, select: { diamondBalance: true } }),
        this.prisma.rechargeWallet.findUnique({ where: { agentId } }),
        this.prisma.rechargeTransaction.aggregate({
          where: { agentId, status: "SUCCESS", createdAt: { gte: startOfDay } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.rechargeTransaction.aggregate({
          where: { agentId, status: "SUCCESS", createdAt: { gte: startOfWeek } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.rechargeTransaction.aggregate({
          where: { agentId, status: "SUCCESS", createdAt: { gte: startOfMonth } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.rechargeTransaction.aggregate({
          where: { agentId, status: "SUCCESS" },
          _sum: { amount: true, agentCommission: true },
          _count: true,
        }),
        this.prisma.rechargeTransaction.findMany({
          where: { agentId, status: "SUCCESS" },
          select: { targetUserId: true },
          distinct: ["targetUserId"],
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { agentId, status: "PENDING" },
          _sum: { amount: true },
        }),
      ]);

    return {
      availableBalance: Number(wallet?.balance ?? 0),
      frozenBalance: Number(wallet?.frozenBalance ?? 0),
      diamondBalance: Number(agent?.diamondBalance ?? 0),
      dailyChargeTotal: Number(dailyAgg._sum.amount ?? 0),
      dailyChargeCount: dailyAgg._count,
      weeklyChargeTotal: Number(weeklyAgg._sum.amount ?? 0),
      monthlyChargeTotal: Number(monthlyAgg._sum.amount ?? 0),
      totalCustomers: distinctCustomers.length,
      totalTransactions: allTimeAgg._count,
      totalEarnings: Number(allTimeAgg._sum.amount ?? 0),
      totalCommissionEarned: Number(allTimeAgg._sum.agentCommission ?? 0),
      pendingWithdrawals: Number(pendingWithdrawals._sum.amount ?? 0),
    };
  }

  async getAgencyDashboard(agencyId: string) {
    const agents = await this.prisma.rechargeAgent.findMany({
      where: { agencyId },
      select: { id: true },
    });
    const agentIds = agents.map((a) => a.id);

    const [transactionAgg, wallets] = await Promise.all([
      this.prisma.rechargeTransaction.aggregate({
        where: { agentId: { in: agentIds }, status: "SUCCESS" },
        _sum: { amount: true, agencyCommission: true },
        _count: true,
      }),
      this.prisma.rechargeWallet.findMany({ where: { agentId: { in: agentIds } } }),
    ]);

    return {
      totalAgents: agentIds.length,
      totalTransactions: transactionAgg._count,
      totalCharged: Number(transactionAgg._sum.amount ?? 0),
      totalAgencyCommission: Number(transactionAgg._sum.agencyCommission ?? 0),
      totalWalletBalance: wallets.reduce((sum, w) => sum + Number(w.balance), 0),
    };
  }
}
