import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RechargeSettingsService } from "./recharge-settings.service";
import { CreateSubAgentDto } from "./dto/create-sub-agent.dto";
import { DistributeBalanceDto } from "./dto/distribute-balance.dto";

@Injectable()
export class RechargeAgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly settings: RechargeSettingsService,
  ) {}

  async createSubAgent(masterAgentId: string, agencyId: string, dto: CreateSubAgentDto) {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }, { username: dto.identifier }],
      },
    });

    if (!targetUser) {
      throw new NotFoundException("No user found matching that identifier");
    }

    const existingAgent = await this.prisma.rechargeAgent.findUnique({
      where: { userId: targetUser.id },
    });
    if (existingAgent) {
      throw new ConflictException("This user is already a recharge agent");
    }

    const settings = await this.settings.getSettings();

    const agent = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rechargeAgent.create({
        data: {
          userId: targetUser.id,
          agencyId,
          role: "SUB_AGENT",
          commissionRate: dto.commissionRate ?? settings.agentCommissionRate,
        },
      });

      await tx.rechargeWallet.create({
        data: { ownerType: "AGENT", agentId: created.id, balance: 0 },
      });

      return created;
    });

    await this.notifications.send(
      targetUser.id,
      "WALLET_CREDITED",
      "تمت إضافتك كوكيل شحن",
      "تمت إضافتك كوكيل فرعي ضمن وكالة الشحن. يمكنك الآن الاطلاع على لوحتك الخاصة.",
      { agentId: agent.id },
    );

    await this.prisma.auditLog.create({
      data: {
        actorId: masterAgentId,
        action: "sub_agent.created",
        entityType: "RechargeAgent",
        entityId: agent.id,
      },
    });

    return agent;
  }

  async listAgents(agencyId: string) {
    return this.prisma.rechargeAgent.findMany({
      where: { agencyId },
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true } },
        wallet: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async setAgentStatus(agencyId: string, subAgentId: string, status: "ACTIVE" | "SUSPENDED") {
    const agent = await this.prisma.rechargeAgent.findFirst({
      where: { id: subAgentId, agencyId },
    });

    if (!agent) {
      throw new NotFoundException("Sub-agent not found in this agency");
    }
    if (agent.role === "MASTER") {
      throw new BadRequestException("Cannot change status of the master agent");
    }

    return this.prisma.rechargeAgent.update({ where: { id: subAgentId }, data: { status } });
  }

  async distributeBalance(masterAgentId: string, agencyId: string, dto: DistributeBalanceDto) {
    const subAgent = await this.prisma.rechargeAgent.findFirst({
      where: { id: dto.subAgentId, agencyId },
      include: { wallet: true },
    });

    if (!subAgent || !subAgent.wallet) {
      throw new NotFoundException("Sub-agent or wallet not found in this agency");
    }

    const masterWallet = await this.prisma.rechargeWallet.findUnique({
      where: { agentId: masterAgentId },
    });

    if (!masterWallet || Number(masterWallet.balance) < dto.amount) {
      throw new BadRequestException("Insufficient balance to distribute");
    }

    const [, updatedSubWallet] = await this.prisma.$transaction([
      this.prisma.rechargeWallet.update({
        where: { agentId: masterAgentId },
        data: { balance: { decrement: dto.amount } },
      }),
      this.prisma.rechargeWallet.update({
        where: { agentId: subAgent.id },
        data: { balance: { increment: dto.amount } },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        actorId: masterAgentId,
        action: "wallet.distributed",
        entityType: "RechargeWallet",
        entityId: updatedSubWallet.id,
        metadata: { amount: dto.amount, subAgentId: subAgent.id },
      },
    });

    await this.notifications.send(
      subAgent.userId,
      "WALLET_CREDITED",
      "تم إيداع رصيد في محفظتك",
      `تم إيداع مبلغ ${dto.amount} في محفظتك من الوكالة الرئيسية.`,
      { amount: dto.amount },
    );

    return updatedSubWallet;
  }
}
