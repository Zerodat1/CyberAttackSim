import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const PUBLIC_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  country: true,
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
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_SELECT });
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
