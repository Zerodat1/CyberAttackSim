import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../common/types/authenticated-user";

export async function authenticateSocket(
  client: Socket,
  jwt: JwtService,
  config: ConfigService,
  prisma: PrismaService,
): Promise<AuthenticatedUser | null> {
  const authHeader = client.handshake.headers.authorization;
  const token: string | undefined =
    client.handshake.auth?.token ?? (authHeader ? authHeader.replace("Bearer ", "") : undefined);

  if (!token) {
    return null;
  }

  try {
    const payload = await jwt.verifyAsync<{ sub: string; sessionId: string }>(token, {
      secret: config.get<string>("jwt.accessSecret"),
    });

    const session = await prisma.session.findUnique({
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
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      globalRole: session.user.globalRole,
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}
