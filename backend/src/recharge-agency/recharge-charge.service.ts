import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { RechargeSettingsService } from "./recharge-settings.service";
import { ChargeUserDto } from "./dto/charge-user.dto";
import { generateTransactionNumber } from "./utils/transaction-number";

export interface ChargeRequestContext {
  ipAddress?: string;
  device?: string;
}

@Injectable()
export class RechargeChargeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly settings: RechargeSettingsService,
    private readonly wallet: WalletService,
  ) {}

  async chargeUser(agentId: string, dto: ChargeUserDto, ctx: ChargeRequestContext) {
    const idempotencyKey = dto.idempotencyKey ?? nanoid(32);

    const existing = await this.prisma.rechargeTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    const agent = await this.prisma.rechargeAgent.findUniqueOrThrow({
      where: { id: agentId },
      include: { agency: true, wallet: true },
    });

    if (!agent.wallet) {
      throw new BadRequestException("Agent wallet not found");
    }

    const settings = await this.settings.getSettings();

    let amount: number;
    let goldCredited: number;
    let bonusPercent: number | null = null;

    if (dto.packageId) {
      const pkg = await this.prisma.rechargePackage.findUnique({ where: { id: dto.packageId } });
      if (!pkg || !pkg.isActive) {
        throw new NotFoundException("Recharge package not found");
      }
      amount = Number(pkg.priceUsd);
      goldCredited = Number(pkg.totalGold);
      bonusPercent = Number(pkg.bonusPercent);
    } else {
      amount = dto.amount as number;
      goldCredited = round2(amount * Number(settings.goldPerCurrencyUnit));
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const chargedToday = await this.prisma.rechargeTransaction.aggregate({
      where: { agentId, createdAt: { gte: startOfDay }, status: "SUCCESS" },
      _sum: { amount: true },
    });
    const totalToday = Number(chargedToday._sum.amount ?? 0) + amount;
    if (totalToday > Number(settings.dailyChargeLimit)) {
      throw new BadRequestException("Daily charge limit exceeded");
    }

    if (Number(agent.wallet.balance) < amount) {
      await this.prisma.rechargeTransaction.create({
        data: {
          transactionNumber: generateTransactionNumber(),
          idempotencyKey,
          agentId,
          targetUserId: dto.targetUserId,
          amount,
          agentCommission: 0,
          agencyCommission: 0,
          platformShare: 0,
          status: "FAILED",
          ipAddress: ctx.ipAddress,
          device: ctx.device,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
        },
      });

      await this.notifications.send(
        agent.userId,
        "CHARGE_FAILED",
        "فشلت عملية الشحن",
        `فشلت عملية شحن بمبلغ ${amount} بسبب عدم كفاية الرصيد.`,
      );

      throw new BadRequestException("Insufficient agent wallet balance");
    }

    const agentCommission = round2((amount * Number(agent.commissionRate)) / 100);
    const agencyCommission = round2((amount * Number(agent.agency.commissionRate)) / 100);
    const platformShare = round2(amount - agentCommission - agencyCommission);

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.rechargeWallet.update({
        where: { agentId },
        data: { balance: { decrement: amount } },
      });

      await this.wallet.creditGold(dto.targetUserId, goldCredited, tx);

      const created = await tx.rechargeTransaction.create({
        data: {
          transactionNumber: generateTransactionNumber(),
          idempotencyKey,
          agentId,
          targetUserId: dto.targetUserId,
          amount,
          agentCommission,
          agencyCommission,
          platformShare,
          packageId: dto.packageId,
          goldCredited,
          bonusPercent,
          status: "SUCCESS",
          ipAddress: ctx.ipAddress,
          device: ctx.device,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
        },
      });

      if (amount >= Number(settings.largeTransactionAlert)) {
        await tx.auditLog.create({
          data: {
            actorId: agent.userId,
            action: "charge.large_transaction",
            entityType: "RechargeTransaction",
            entityId: created.id,
            metadata: { amount },
            ipAddress: ctx.ipAddress,
          },
        });
      }

      return created;
    });

    await this.notifications.send(
      agent.userId,
      "CHARGE_SUCCESS",
      "تمت عملية الشحن بنجاح",
      `تم شحن ${amount} للمستخدم بنجاح. عمولتك: ${agentCommission}.`,
      { transactionId: transaction.id },
    );

    await this.notifications.send(
      dto.targetUserId,
      "WALLET_CREDITED",
      "تم شحن رصيدك",
      `قام وكيل الشحن بإضافة ${goldCredited} ذهب إلى محفظتك.`,
      { transactionId: transaction.id, goldCredited },
    );

    return transaction;
  }

  async listTransactions(agentId?: string, targetUserId?: string) {
    return this.prisma.rechargeTransaction.findMany({
      where: { agentId, targetUserId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
