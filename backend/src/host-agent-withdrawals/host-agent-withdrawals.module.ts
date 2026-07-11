import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WalletModule } from "../wallet/wallet.module";
import { HostAgenciesModule } from "../host-agencies/host-agencies.module";
import { RechargeAgencyModule } from "../recharge-agency/recharge-agency.module";
import { HostAgentWithdrawalsService } from "./host-agent-withdrawals.service";
import { HostAgentWithdrawalsController } from "./host-agent-withdrawals.controller";
import { AgentCashoutInboxController } from "./agent-cashout-inbox.controller";

@Module({
  imports: [NotificationsModule, WalletModule, HostAgenciesModule, RechargeAgencyModule],
  controllers: [HostAgentWithdrawalsController, AgentCashoutInboxController],
  providers: [HostAgentWithdrawalsService],
})
export class HostAgentWithdrawalsModule {}
