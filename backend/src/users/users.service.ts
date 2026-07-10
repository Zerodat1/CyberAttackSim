import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { computeLevel } from "./utils/levels.util";

const PUBLIC_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  country: true,
  gender: true,
  globalRole: true,
  twoFactorEnabled: true,
  createdAt: true,
  vipLevel: true,
  vipExpiresAt: true,
  activeFrame: { select: { emoji: true, colorHex: true } },
  activeEntrance: { select: { emoji: true, colorHex: true } },
  activeBubble: { select: { emoji: true, colorHex: true } },
  activeMicEffect: { select: { emoji: true, colorHex: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const [user, wealthSum, charmSum] = await Promise.all([
      this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT }),
      this.prisma.giftSend.aggregate({ where: { senderId: id }, _sum: { totalGoldCost: true } }),
      this.prisma.giftSend.aggregate({ where: { recipientId: id }, _sum: { totalGoldCost: true } }),
    ]);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      ...user,
      levels: {
        wealth: computeLevel(Number(wealthSum._sum.totalGoldCost ?? 0)),
        charm: computeLevel(Number(charmSum._sum.totalGoldCost ?? 0)),
      },
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    try {
      return await this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_SELECT });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("This email is already in use");
      }
      throw error;
    }
  }

  async getLoginHistory(id: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getActiveSessions(id: string) {
    return this.prisma.session.findMany({
      where: { userId: id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    });
  }
}
