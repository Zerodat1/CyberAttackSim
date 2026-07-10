import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { GlobalRole, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { sessionCacheKey } from "../auth/strategies/jwt.strategy";
import { BanIpDto } from "./dto/ban-ip.dto";

const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  globalRole: true,
  isActive: true,
  bannedAt: true,
  bannedReason: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listUsers(search?: string, page = 1, pageSize = 20) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async banUser(targetUserId: string, actingUserId: string, reason?: string) {
    if (targetUserId === actingUserId) {
      throw new BadRequestException("You cannot ban your own account");
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException("User not found");
    }
    if (target.globalRole === GlobalRole.OWNER) {
      throw new BadRequestException("Cannot ban another owner account");
    }

    const sessions = await this.prisma.session.findMany({
      where: { userId: targetUserId, revokedAt: null },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: false, bannedAt: new Date(), bannedReason: reason ?? null },
      }),
      this.prisma.session.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await Promise.all(sessions.map((session) => this.cache.del(sessionCacheKey(session.id))));

    return this.prisma.user.findUnique({ where: { id: targetUserId }, select: ADMIN_USER_SELECT });
  }

  async unbanUser(targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: true, bannedAt: null, bannedReason: null },
      select: ADMIN_USER_SELECT,
    });
  }

  listBannedIps() {
    return this.prisma.bannedIp.findMany({
      include: { bannedBy: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async banIp(dto: BanIpDto, actingUserId: string, requestIp?: string) {
    if (requestIp && dto.ipAddress === requestIp) {
      throw new BadRequestException("You cannot ban the IP address you are currently connecting from");
    }

    const existing = await this.prisma.bannedIp.findUnique({ where: { ipAddress: dto.ipAddress } });
    if (existing) {
      throw new ConflictException("This IP address is already banned");
    }

    return this.prisma.bannedIp.create({
      data: { ipAddress: dto.ipAddress, reason: dto.reason, bannedById: actingUserId },
    });
  }

  async unbanIp(id: string) {
    const existing = await this.prisma.bannedIp.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Banned IP entry not found");
    }
    await this.prisma.bannedIp.delete({ where: { id } });
  }
}
