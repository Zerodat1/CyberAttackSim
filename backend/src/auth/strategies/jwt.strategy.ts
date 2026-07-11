import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../redis/cache.service";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

export interface JwtAccessPayload {
  sub: string;
  sessionId: string;
}

export const sessionCacheKey = (sessionId: string) => `session-auth:${sessionId}`;
const SESSION_CACHE_TTL_SECONDS = 30;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("jwt.accessSecret"),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const cacheKey = sessionCacheKey(payload.sessionId);
    const cached = await this.cache.get<AuthenticatedUser>(cacheKey);
    if (cached && cached.id === payload.sub) {
      return cached;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.userId !== payload.sub ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    const authenticatedUser: AuthenticatedUser = {
      id: session.user.id,
      username: session.user.username,
      globalRole: session.user.globalRole,
      sessionId: session.id,
    };

    await this.cache.set(cacheKey, authenticatedUser, SESSION_CACHE_TTL_SECONDS);

    return authenticatedUser;
  }
}
