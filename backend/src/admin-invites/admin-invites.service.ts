import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import * as argon2 from "argon2";
import { GlobalRole, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService, RequestContext } from "../auth/auth.service";
import { RegisterDto } from "../auth/dto/register.dto";

@Injectable()
export class AdminInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(createdById: string, expiresInHours?: number) {
    const token = nanoid(32);
    return this.prisma.adminInvite.create({
      data: {
        token,
        createdById,
        expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null,
      },
    });
  }

  list() {
    return this.prisma.adminInvite.findMany({
      include: {
        usedBy: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(id: string) {
    const invite = await this.prisma.adminInvite.findUnique({ where: { id } });
    if (!invite) {
      throw new NotFoundException("Invite not found");
    }
    if (invite.usedById) {
      throw new BadRequestException("Invite already used");
    }
    await this.prisma.adminInvite.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async validate(token: string) {
    await this.findValidInvite(token);
    return { valid: true };
  }

  async registerViaToken(token: string, dto: RegisterDto, ctx: RequestContext) {
    const invite = await this.findValidInvite(token);

    const orConditions: Prisma.UserWhereInput[] = [{ username: dto.username }];
    if (dto.email) orConditions.push({ email: dto.email });
    if (dto.phone) orConditions.push({ phone: dto.phone });

    const existing = await this.prisma.user.findFirst({ where: { OR: orConditions } });
    if (existing) {
      throw new ConflictException("Email, phone, or username already in use");
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          fullName: dto.fullName,
          username: dto.username,
          country: dto.country,
          globalRole: GlobalRole.ADMIN,
        },
      });

      const claim = await tx.adminInvite.updateMany({
        where: { id: invite.id, usedById: null, revokedAt: null },
        data: { usedById: created.id, usedAt: new Date() },
      });

      if (claim.count === 0) {
        throw new ConflictException("This invite link has already been used");
      }

      return created;
    });

    return this.authService.issueSession(user.id, ctx);
  }

  private async findValidInvite(token: string) {
    const invite = await this.prisma.adminInvite.findUnique({ where: { token } });
    if (!invite || invite.revokedAt) {
      throw new NotFoundException("Invite link is invalid");
    }
    if (invite.usedById) {
      throw new ConflictException("This invite link has already been used");
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ConflictException("This invite link has expired");
    }
    return invite;
  }
}
