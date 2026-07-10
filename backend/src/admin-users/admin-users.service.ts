import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { GlobalRole, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../redis/cache.service";
import { sessionCacheKey } from "../auth/strategies/jwt.strategy";
import { BanIpDto } from "./dto/ban-ip.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";

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

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false, bannedAt: new Date(), bannedReason: reason ?? null },
    });
    await this.revokeSessions(targetUserId);

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

  listAdmins() {
    return this.prisma.user.findMany({
      where: { globalRole: GlobalRole.ADMIN },
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException("Email or username already in use");
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        username: dto.username,
        globalRole: GlobalRole.ADMIN,
      },
      select: ADMIN_USER_SELECT,
    });
  }

  async updateAdminEmail(targetUserId: string, email: string) {
    const target = await this.findAdmin(targetUserId);

    const existing = await this.prisma.user.findFirst({ where: { email, id: { not: target.id } } });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    return this.prisma.user.update({
      where: { id: target.id },
      data: { email },
      select: ADMIN_USER_SELECT,
    });
  }

  async updateAdminPassword(targetUserId: string, password: string) {
    const target = await this.findAdmin(targetUserId);
    const passwordHash = await argon2.hash(password);

    await this.prisma.user.update({ where: { id: target.id }, data: { passwordHash } });
    await this.revokeSessions(target.id);

    return this.prisma.user.findUnique({ where: { id: target.id }, select: ADMIN_USER_SELECT });
  }

  async revokeAdmin(targetUserId: string) {
    const target = await this.findAdmin(targetUserId);

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: { globalRole: GlobalRole.USER },
      select: ADMIN_USER_SELECT,
    });
    await this.revokeSessions(target.id);

    return updated;
  }

  private async findAdmin(targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException("User not found");
    }
    if (target.globalRole !== GlobalRole.ADMIN) {
      throw new BadRequestException("Target user is not an admin");
    }
    return target;
  }

  private async revokeSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });

    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await Promise.all(sessions.map((session) => this.cache.del(sessionCacheKey(session.id))));
  }
}
