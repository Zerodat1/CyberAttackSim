import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { HostAgenciesService } from "./host-agencies.service";
import { HostAgenciesController } from "./host-agencies.controller";
import { HostAgenciesAdminController } from "./host-agencies-admin.controller";
import { HostEconomySettingsService } from "./host-economy-settings.service";
import { HostTargetTiersService } from "./host-target-tiers.service";
import { HostEarningsService } from "./host-earnings.service";
import { HostWithdrawalsService } from "./host-withdrawals.service";

@Module({
  imports: [NotificationsModule, WalletModule],
  controllers: [HostAgenciesController, HostAgenciesAdminController],
  providers: [
    HostAgenciesService,
    HostEconomySettingsService,
    HostTargetTiersService,
    HostEarningsService,
    HostWithdrawalsService,
  ],
  exports: [HostEarningsService, HostEconomySettingsService],
})
export class HostAgenciesModule {}
