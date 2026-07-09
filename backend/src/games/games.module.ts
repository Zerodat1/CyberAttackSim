import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { GamesService } from "./games.service";
import { GamesController } from "./games.controller";

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
