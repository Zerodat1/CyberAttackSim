import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { UpdateVipLevelDto } from "./dto/update-vip-level.dto";

@Injectable()
export class VipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  listLevels() {
    return this.prisma.vipLevel.findMany({ where: { isActive: true }, orderBy: { level: "asc" } });
  }

  async myStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { vipLevel: true, vipExpiresAt: true },
    });

    const isActive = !!user.vipLevel && !!user.vipExpiresAt && user.vipExpiresAt > new Date();
    const currentLevel = isActive
      ? await this.prisma.vipLevel.findUnique({ where: { level: user.vipLevel! } })
      : null;

    return {
      vipLevel: isActive ? user.vipLevel : null,
      vipExpiresAt: user.vipExpiresAt,
      isActive,
      current: currentLevel,
    };
  }

  async purchase(userId: string, level: number) {
    const vipLevel = await this.prisma.vipLevel.findUnique({ where: { level } });
    if (!vipLevel || !vipLevel.isActive) {
      throw new NotFoundException("VIP level not found");
    }

    const expiresAt = new Date(Date.now() + vipLevel.durationDays * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      await this.wallet.debitGold(userId, Number(vipLevel.priceGold), tx);
      return tx.user.update({
        where: { id: userId },
        data: { vipLevel: level, vipExpiresAt: expiresAt },
        select: { id: true, vipLevel: true, vipExpiresAt: true },
      });
    });
  }

  adminList() {
    return this.prisma.vipLevel.findMany({ orderBy: { level: "asc" } });
  }

  async updateLevel(level: number, dto: UpdateVipLevelDto) {
    const existing = await this.prisma.vipLevel.findUnique({ where: { level } });
    if (!existing) {
      throw new NotFoundException("VIP level not found");
    }
    return this.prisma.vipLevel.update({ where: { level }, data: dto });
  }
}
