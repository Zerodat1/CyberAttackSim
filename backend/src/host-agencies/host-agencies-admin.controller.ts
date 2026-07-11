import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { HostAgenciesService } from "./host-agencies.service";
import { HostEconomySettingsService } from "./host-economy-settings.service";
import { HostTargetTiersService } from "./host-target-tiers.service";
import { HostEarningsService } from "./host-earnings.service";
import { HostWithdrawalsService } from "./host-withdrawals.service";
import { CreateHostTargetTierDto } from "./dto/create-host-target-tier.dto";
import { UpdateHostTargetTierDto } from "./dto/update-host-target-tier.dto";
import { UpdateHostEconomySettingsDto } from "./dto/update-host-economy-settings.dto";
import { UpdateAgencyEconomyDto } from "./dto/update-agency-economy.dto";
import { ReviewRequestDto } from "./dto/review-request.dto";

@ApiTags("host-agencies-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@Controller("host-agencies-admin")
export class HostAgenciesAdminController {
  constructor(
    private readonly hostAgenciesService: HostAgenciesService,
    private readonly economySettings: HostEconomySettingsService,
    private readonly targetTiers: HostTargetTiersService,
    private readonly earnings: HostEarningsService,
    private readonly withdrawals: HostWithdrawalsService,
  ) {}

  @Get("economy-settings")
  getEconomySettings() {
    return this.economySettings.getSettings();
  }

  @Patch("economy-settings")
  updateEconomySettings(@Body() dto: UpdateHostEconomySettingsDto) {
    return this.economySettings.updateSettings(dto);
  }

  @Get("target-tiers")
  listTargetTiers() {
    return this.targetTiers.list();
  }

  @Post("target-tiers")
  createTargetTier(@Body() dto: CreateHostTargetTierDto) {
    return this.targetTiers.create(dto);
  }

  @Patch("target-tiers/:id")
  updateTargetTier(@Param("id") id: string, @Body() dto: UpdateHostTargetTierDto) {
    return this.targetTiers.update(id, dto);
  }

  @Delete("target-tiers/:id")
  deleteTargetTier(@Param("id") id: string) {
    return this.targetTiers.delete(id);
  }

  @Get("agencies")
  listAgencies() {
    return this.hostAgenciesService.adminListAgencies();
  }

  @Get("agencies/:id")
  getAgencyDashboard(@Param("id") id: string) {
    return this.earnings.getAgencyDashboard(id);
  }

  @Patch("agencies/:id")
  updateAgencyEconomy(@Param("id") id: string, @Body() dto: UpdateAgencyEconomyDto) {
    return this.hostAgenciesService.updateAgencyEconomy(id, dto);
  }

  @Get("host-withdrawals")
  listHostWithdrawals(@Query("status") status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") {
    return this.withdrawals.listHostWithdrawals(status);
  }

  @Patch("host-withdrawals/:id/review")
  reviewHostWithdrawal(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.withdrawals.reviewHostWithdrawal(id, user.id, dto);
  }

  @Get("agency-withdrawals")
  listAgencyWithdrawals(@Query("status") status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") {
    return this.withdrawals.listAgencyWithdrawals(status);
  }

  @Patch("agency-withdrawals/:id/review")
  reviewAgencyWithdrawal(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.withdrawals.reviewAgencyWithdrawal(id, user.id, dto);
  }
}
