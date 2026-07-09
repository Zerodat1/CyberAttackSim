import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { RechargeWalletService } from "../recharge-wallet.service";
import { RechargeSettingsService } from "../recharge-settings.service";
import { RechargeStatsService } from "../recharge-stats.service";
import { ReviewRequestDto } from "../dto/review-request.dto";
import { ManualCreditDto } from "../dto/manual-credit.dto";
import { UpdateCommissionSettingsDto } from "../dto/update-commission-settings.dto";

@ApiTags("recharge-agency-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER, GlobalRole.RECHARGE_MANAGER)
@Controller("recharge-agency/admin")
export class RechargeAdminController {
  constructor(
    private readonly walletService: RechargeWalletService,
    private readonly settingsService: RechargeSettingsService,
    private readonly statsService: RechargeStatsService,
  ) {}

  @Get("topup-requests")
  listTopUpRequests(@Query("status") status?: "PENDING" | "APPROVED" | "REJECTED") {
    return this.walletService.listTopUpRequests(undefined, status);
  }

  @Patch("topup-requests/:id/review")
  reviewTopUpRequest(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.walletService.reviewTopUpRequest(id, user.id, dto);
  }

  @Post("agents/:agentId/manual-credit")
  manualCredit(
    @Param("agentId") agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualCreditDto,
  ) {
    return this.walletService.manualCredit(agentId, user.id, dto);
  }

  @Get("withdrawal-requests")
  listWithdrawalRequests(
    @Query("status") status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED",
  ) {
    return this.walletService.listWithdrawalRequests(undefined, status);
  }

  @Patch("withdrawal-requests/:id/review")
  reviewWithdrawalRequest(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.walletService.reviewWithdrawalRequest(id, user.id, dto);
  }

  @Get("settings")
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateCommissionSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get("agencies/:agencyId/stats")
  agencyStats(@Param("agencyId") agencyId: string) {
    return this.statsService.getAgencyDashboard(agencyId);
  }
}
