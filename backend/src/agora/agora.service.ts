import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RtcRole, RtcTokenBuilder } from "agora-token";

const TOKEN_EXPIRATION_SECONDS = 3600;

@Injectable()
export class AgoraService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return !!this.config.get<string>("agora.appId") && !!this.config.get<string>("agora.appCertificate");
  }

  buildRtcToken(channelName: string, userAccount: string, canPublish: boolean) {
    const appId = this.config.get<string>("agora.appId");
    const appCertificate = this.config.get<string>("agora.appCertificate");
    if (!appId || !appCertificate) {
      throw new ServiceUnavailableException(
        "Voice service is not configured (AGORA_APP_ID / AGORA_APP_CERTIFICATE missing)",
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = now + TOKEN_EXPIRATION_SECONDS;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      userAccount,
      canPublish ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return { appId, channelName, token, uid: userAccount, expiresAt: privilegeExpiredTs };
  }
}
