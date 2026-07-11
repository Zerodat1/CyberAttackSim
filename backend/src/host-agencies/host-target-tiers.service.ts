import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHostTargetTierDto } from "./dto/create-host-target-tier.dto";
import { UpdateHostTargetTierDto } from "./dto/update-host-target-tier.dto";

export interface TierProgress {
  currentTier: { thresholdDiamonds: number; salaryUsd: number } | null;
  nextTier: { thresholdDiamonds: number; salaryUsd: number } | null;
  progressPercent: number;
}

@Injectable()
export class HostTargetTiersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.hostTargetTier.findMany({ orderBy: { thresholdDiamonds: "asc" } });
  }

  create(dto: CreateHostTargetTierDto) {
    return this.prisma.hostTargetTier.create({ data: dto });
  }

  async update(id: string, dto: UpdateHostTargetTierDto) {
    await this.getOrThrow(id);
    return this.prisma.hostTargetTier.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.getOrThrow(id);
    await this.prisma.hostTargetTier.delete({ where: { id } });
  }

  async computeProgress(diamonds: number): Promise<TierProgress> {
    const tiers = await this.list();
    const sorted = tiers
      .map((t) => ({ thresholdDiamonds: Number(t.thresholdDiamonds), salaryUsd: Number(t.salaryUsd) }))
      .sort((a, b) => a.thresholdDiamonds - b.thresholdDiamonds);

    let currentTier: TierProgress["currentTier"] = null;
    let nextTier: TierProgress["nextTier"] = null;

    for (const tier of sorted) {
      if (diamonds >= tier.thresholdDiamonds) {
        currentTier = tier;
      } else {
        nextTier = tier;
        break;
      }
    }

    let progressPercent = 0;
    if (nextTier) {
      const floor = currentTier?.thresholdDiamonds ?? 0;
      const span = nextTier.thresholdDiamonds - floor;
      progressPercent = span > 0 ? Math.min(100, Math.max(0, ((diamonds - floor) / span) * 100)) : 0;
    } else if (currentTier) {
      progressPercent = 100;
    }

    return { currentTier, nextTier, progressPercent: Math.round(progressPercent * 100) / 100 };
  }

  private async getOrThrow(id: string) {
    const tier = await this.prisma.hostTargetTier.findUnique({ where: { id } });
    if (!tier) {
      throw new NotFoundException("Target tier not found");
    }
    return tier;
  }
}
