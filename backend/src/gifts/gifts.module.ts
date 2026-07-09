import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { GiftsService } from "./gifts.service";
import { GiftsController } from "./gifts.controller";
import { GiftsAdminController } from "./gifts-admin.controller";

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [GiftsController, GiftsAdminController],
  providers: [GiftsService],
})
export class GiftsModule {}
