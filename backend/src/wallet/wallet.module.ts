import { Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { RechargePackagesService } from "../recharge-agency/recharge-packages.service";

@Module({
  controllers: [WalletController],
  providers: [WalletService, RechargePackagesService],
  exports: [WalletService, RechargePackagesService],
})
export class WalletModule {}
