import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { authenticator } from "otplib";
import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext) {
    const orConditions: Prisma.UserWhereInput[] = [{ username: dto.username }];
    if (dto.email) orConditions.push({ email: dto.email });
    if (dto.phone) orConditions.push({ phone: dto.phone });

    const existing = await this.prisma.user.findFirst({
      where: { OR: orConditions },
    });

    if (existing) {
      throw new ConflictException("Email, phone, or username already in use");
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        username: dto.username,
        country: dto.country,
      },
    });

    return this.issueSession(user.id, ctx);
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const identifier = dto.identifier ?? dto.phone;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("Account temporarily locked, try again later");
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      await this.recordFailedAttempt(user.id, ctx);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new UnauthorizedException("Two-factor authentication code required");
      }
      const valid = authenticator.check(dto.twoFactorCode, user.twoFactorSecret ?? "");
      if (!valid) {
        await this.recordFailedAttempt(user.id, ctx);
        throw new UnauthorizedException("Invalid two-factor code");
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const isNewDevice = ctx.userAgent
      ? !(await this.prisma.loginHistory.findFirst({
          where: { userId: user.id, device: ctx.userAgent, success: true },
        }))
      : false;

    await this.prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ctx.ipAddress,
        device: ctx.userAgent,
        success: true,
      },
    });

    if (isNewDevice) {
      await this.notifications.send(
        user.id,
        "NEW_DEVICE_LOGIN",
        "تسجيل دخول من جهاز جديد",
        "تم تسجيل الدخول إلى حسابك من جهاز غير معروف مسبقًا.",
        { ipAddress: ctx.ipAddress, device: ctx.userAgent },
      );
    }

    return this.issueSession(user.id, ctx);
  }

  async refresh(refreshToken: string) {
    const [sessionId, rawToken] = refreshToken.split(".");
    if (!sessionId || !rawToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired or revoked");
    }

    const valid = await argon2.verify(session.refreshTokenHash, rawToken);
    if (!valid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newRawToken = nanoid(48);
    const refreshExpiresAt = this.computeRefreshExpiry();

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(newRawToken),
        expiresAt: refreshExpiresAt,
      },
    });

    const accessToken = await this.signAccessToken(session.userId, session.id);

    return {
      accessToken,
      refreshToken: `${session.id}.${newRawToken}`,
    };
  }

  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto, currentSessionId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    await this.prisma.session.updateMany({
      where: { userId, id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.notifications.send(
      userId,
      "NEW_DEVICE_LOGIN",
      "تم تغيير كلمة المرور",
      "تم تغيير كلمة مرور حسابك بنجاح. إذا لم تقم بذلك، تواصل مع الدعم فورًا.",
    );
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    const otpauthUrl = authenticator.keyuri(user.username, "Code", secret);
    return { secret, otpauthUrl };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) {
      throw new UnauthorizedException("Two-factor secret not generated yet");
    }
    const valid = authenticator.check(code, user.twoFactorSecret);
    if (!valid) {
      throw new UnauthorizedException("Invalid two-factor code");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret || !authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException("Invalid two-factor code");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  private async recordFailedAttempt(userId: string, ctx: RequestContext) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    await this.prisma.loginHistory.create({
      data: { userId, ipAddress: ctx.ipAddress, device: ctx.userAgent, success: false },
    });

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) },
      });
    }
  }

  async issueSession(userId: string, ctx: RequestContext) {
    const rawRefreshToken = nanoid(48);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: await argon2.hash(rawRefreshToken),
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        device: ctx.userAgent,
        expiresAt: this.computeRefreshExpiry(),
      },
    });

    const accessToken = await this.signAccessToken(userId, session.id);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return {
      accessToken,
      refreshToken: `${session.id}.${rawRefreshToken}`,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        globalRole: user.globalRole,
      },
    };
  }

  private signAccessToken(userId: string, sessionId: string) {
    return this.jwt.signAsync(
      { sub: userId, sessionId },
      {
        secret: this.config.get<string>("jwt.accessSecret"),
        expiresIn: this.config.get<string>("jwt.accessExpiresIn"),
      },
    );
  }

  private computeRefreshExpiry(): Date {
    const expiresIn = this.config.get<string>("jwt.refreshExpiresIn", "30d");
    const days = parseInt(expiresIn.replace(/[^0-9]/g, ""), 10) || 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
