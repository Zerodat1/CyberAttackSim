import { SetMetadata } from "@nestjs/common";

export const SKIP_IP_BAN_KEY = "skipIpBan";
export const SkipIpBan = () => SetMetadata(SKIP_IP_BAN_KEY, true);
