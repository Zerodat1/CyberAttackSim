import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { computeLevel } from "../users/utils/levels.util";

export type LeaderboardType = "ROOM" | "WEALTH" | "CHARM";
export type LeaderboardPeriod = "DAY" | "WEEK" | "MONTH";

const TAKE = 30;

const userSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  vipLevel: true,
  activeFrame: { select: { emoji: true, colorHex: true } },
} as const;

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  getLeaderboard(type: LeaderboardType, period: LeaderboardPeriod) {
    const since = periodStart(period);
    if (type === "ROOM") return this.roomLeaderboard(since);
    if (type === "CHARM") return this.charmLeaderboard(since);
    return this.wealthLeaderboard(since);
  }

  private async wealthLeaderboard(since: Date) {
    const grouped = await this.prisma.giftSend.groupBy({
      by: ["senderId"],
      where: { createdAt: { gte: since } },
      _sum: { totalGoldCost: true },
      orderBy: { _sum: { totalGoldCost: "desc" } },
      take: TAKE,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((row) => row.senderId) } },
      select: userSelect,
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped
      .filter((row) => userMap.has(row.senderId))
      .map((row, index) => {
        const score = Number(row._sum.totalGoldCost ?? 0);
        return { rank: index + 1, score, level: computeLevel(score).level, user: userMap.get(row.senderId) };
      });
  }

  private async charmLeaderboard(since: Date) {
    const grouped = await this.prisma.giftSend.groupBy({
      by: ["recipientId"],
      where: { createdAt: { gte: since } },
      _sum: { totalGoldCost: true },
      orderBy: { _sum: { totalGoldCost: "desc" } },
      take: TAKE,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((row) => row.recipientId) } },
      select: userSelect,
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped
      .filter((row) => userMap.has(row.recipientId))
      .map((row, index) => {
        const score = Number(row._sum.totalGoldCost ?? 0);
        return { rank: index + 1, score, level: computeLevel(score).level, user: userMap.get(row.recipientId) };
      });
  }

  private async roomLeaderboard(since: Date) {
    const grouped = await this.prisma.giftSend.groupBy({
      by: ["roomId"],
      where: { createdAt: { gte: since }, roomId: { not: null } },
      _sum: { totalGoldCost: true },
      orderBy: { _sum: { totalGoldCost: "desc" } },
      take: TAKE,
    });
    const ids = grouped.map((row) => row.roomId).filter((id): id is string => id !== null);
    const rooms = await this.prisma.room.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, backgroundUrl: true },
    });
    const roomMap = new Map(rooms.map((r) => [r.id, r]));

    return grouped
      .filter((row) => row.roomId !== null && roomMap.has(row.roomId))
      .map((row, index) => {
        const score = Number(row._sum.totalGoldCost ?? 0);
        return { rank: index + 1, score, level: computeLevel(score).level, room: roomMap.get(row.roomId as string) };
      });
  }
}

function periodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  if (period === "DAY") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "WEEK") {
    const diffToMonday = (now.getDay() + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
