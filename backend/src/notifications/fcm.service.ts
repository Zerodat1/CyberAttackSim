import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { cert, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const encoded = this.config.get<string>("firebase.serviceAccountJsonBase64");
    if (!encoded) {
      this.logger.warn(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is not set — push notifications are disabled. " +
          "In-app notifications still work normally.",
      );
      return;
    }

    try {
      const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
      this.app = initializeApp({ credential: cert(serviceAccount) });
    } catch (error) {
      this.logger.error("Failed to initialize Firebase Admin SDK", error as Error);
    }
  }

  get isEnabled(): boolean {
    return this.app !== null;
  }

  async registerToken(userId: string, token: string, platform: string) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async unregisterToken(token: string, userId: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token, userId } });
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.app) return;

    const tokens = await this.prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
    if (tokens.length === 0) return;

    const response = await getMessaging(this.app).sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title, body },
      data,
    });

    const deadTokens = response.responses
      .map((result, index) => (result.success ? null : tokens[index].token))
      .filter((token): token is string => token !== null);

    if (deadTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: deadTokens } } });
    }
  }
}
