import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRechargePackageDto } from "./dto/create-recharge-package.dto";
import { UpdateRechargePackageDto } from "./dto/update-recharge-package.dto";

@Injectable()
export class RechargePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.rechargePackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  listAll() {
    return this.prisma.rechargePackage.findMany({ orderBy: { sortOrder: "asc" } });
  }

  create(dto: CreateRechargePackageDto) {
    return this.prisma.rechargePackage.create({
      data: { ...dto, totalGold: computeTotalGold(dto.baseGold, dto.bonusPercent) },
    });
  }

  async update(id: string, dto: UpdateRechargePackageDto) {
    const existing = await this.getOrThrow(id);
    const baseGold = dto.baseGold ?? Number(existing.baseGold);
    const bonusPercent = dto.bonusPercent ?? Number(existing.bonusPercent);

    return this.prisma.rechargePackage.update({
      where: { id },
      data: { ...dto, totalGold: computeTotalGold(baseGold, bonusPercent) },
    });
  }

  async delete(id: string) {
    await this.getOrThrow(id);
    await this.prisma.rechargePackage.delete({ where: { id } });
  }

  private async getOrThrow(id: string) {
    const pkg = await this.prisma.rechargePackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new NotFoundException("Recharge package not found");
    }
    return pkg;
  }
}

function computeTotalGold(baseGold: number, bonusPercent: number): number {
  return Math.round(baseGold * (1 + bonusPercent / 100) * 100) / 100;
}
