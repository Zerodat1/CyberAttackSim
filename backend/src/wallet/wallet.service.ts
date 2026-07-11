import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    return this.prisma.userWallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async creditGold(userId: string, amount: number, tx: Prisma.TransactionClient = this.prisma) {
    await this.ensureWallet(userId, tx);
    return tx.userWallet.update({ where: { userId }, data: { goldBalance: { increment: amount } } });
  }

  async debitGold(userId: string, amount: number, tx: Prisma.TransactionClient = this.prisma) {
    await this.ensureWallet(userId, tx);
    const result = await tx.userWallet.updateMany({
      where: { userId, goldBalance: { gte: amount } },
      data: { goldBalance: { decrement: amount } },
    });
    if (result.count === 0) {
      throw new BadRequestException("Insufficient gold balance");
    }
  }

  async creditDiamond(userId: string, amount: number, tx: Prisma.TransactionClient = this.prisma) {
    await this.ensureWallet(userId, tx);
    return tx.userWallet.update({ where: { userId }, data: { diamondBalance: { increment: amount } } });
  }

  async debitDiamond(userId: string, amount: number, tx: Prisma.TransactionClient = this.prisma) {
    await this.ensureWallet(userId, tx);
    const result = await tx.userWallet.updateMany({
      where: { userId, diamondBalance: { gte: amount } },
      data: { diamondBalance: { decrement: amount } },
    });
    if (result.count === 0) {
      throw new BadRequestException("Insufficient diamond balance");
    }
  }

  private async ensureWallet(userId: string, tx: Prisma.TransactionClient) {
    await tx.userWallet.upsert({ where: { userId }, update: {}, create: { userId } });
  }
}
