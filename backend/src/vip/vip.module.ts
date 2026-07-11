import { Module } from "@nestjs/common";
import { WalletModule } from "../wallet/wallet.module";
import { VipController } from "./vip.controller";
import { VipAdminController } from "./vip-admin.controller";
import { VipService } from "./vip.service";

@Module({
  imports: [WalletModule],
  controllers: [VipController, VipAdminController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
