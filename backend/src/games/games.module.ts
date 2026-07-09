import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { GamesService } from "./games.service";
import {
  CrashGamesController,
  GamesController,
  GamesHistoryController,
  SlotsGamesController,
  WheelGamesController,
} from "./games.controller";

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [
    GamesController,
    WheelGamesController,
    SlotsGamesController,
    CrashGamesController,
    GamesHistoryController,
  ],
  providers: [GamesService],
})
export class GamesModule {}
