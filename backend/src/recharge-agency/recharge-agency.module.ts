import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { RechargeApplicationsController } from "./controllers/recharge-applications.controller";
import { RechargeWalletController } from "./controllers/recharge-wallet.controller";
import { RechargeAdminController } from "./controllers/recharge-admin.controller";
import { RechargeChargeController } from "./controllers/recharge-charge.controller";
import { RechargeHistoryController } from "./controllers/recharge-history.controller";
import { RechargeApplicationsService } from "./recharge-applications.service";
import { RechargeWalletService } from "./recharge-wallet.service";
import { RechargeChargeService } from "./recharge-charge.service";
import { RechargeSettingsService } from "./recharge-settings.service";
import { RechargeStatsService } from "./recharge-stats.service";
import { RechargeAgentGuard } from "./guards/recharge-agent.guard";

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [
    RechargeApplicationsController,
    RechargeWalletController,
    RechargeAdminController,
    RechargeChargeController,
    RechargeHistoryController,
  ],
  providers: [
    RechargeApplicationsService,
    RechargeWalletService,
    RechargeChargeService,
    RechargeSettingsService,
    RechargeStatsService,
    RechargeAgentGuard,
  ],
  exports: [RechargeAgentGuard],
})
export class RechargeAgencyModule {}
