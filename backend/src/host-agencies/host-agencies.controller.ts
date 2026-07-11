import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { HostAgenciesService } from "./host-agencies.service";
import { HostTargetTiersService } from "./host-target-tiers.service";
import { HostEarningsService } from "./host-earnings.service";
import { HostWithdrawalsService } from "./host-withdrawals.service";
import { CreateHostAgencyDto } from "./dto/create-host-agency.dto";
import { UpdateHostAgencyDto } from "./dto/update-host-agency.dto";
import { CreateHostWithdrawalDto } from "./dto/create-host-withdrawal.dto";
import { CreateAgencyWithdrawalDto } from "./dto/create-agency-withdrawal.dto";

@ApiTags("host-agencies")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("host-agencies")
export class HostAgenciesController {
  constructor(
    private readonly hostAgenciesService: HostAgenciesService,
    private readonly targetTiers: HostTargetTiersService,
    private readonly earnings: HostEarningsService,
    private readonly withdrawals: HostWithdrawalsService,
  ) {}

  // --- Static routes registered before ":id" so they aren't swallowed by the param route ---

  @Get()
  list() {
    return this.hostAgenciesService.listAgencies();
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.hostAgenciesService.getMyMembership(user.id);
  }

  @Get("target-tiers")
  listTargetTiers() {
    return this.targetTiers.list();
  }

  @Get("me/dashboard")
  getMyDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.earnings.getHostDashboard(user.id);
  }

  @Get("withdrawals")
  listMyWithdrawals(@CurrentUser() user: AuthenticatedUser) {
    return this.withdrawals.listMyHostWithdrawals(user.id);
  }

  @Post("withdrawals")
  createWithdrawal(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHostWithdrawalDto) {
    return this.withdrawals.createHostWithdrawal(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHostAgencyDto) {
    return this.hostAgenciesService.createAgency(user.id, dto);
  }

  @Post("leave")
  leave(@CurrentUser() user: AuthenticatedUser) {
    return this.hostAgenciesService.leaveAgency(user.id);
  }

  // --- Param routes ---

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.hostAgenciesService.getAgencyDetail(id);
  }

  @Post(":id/join")
  join(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.hostAgenciesService.joinAgency(user.id, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateHostAgencyDto) {
    return this.hostAgenciesService.updateAgency(user.id, id, dto);
  }

  @Delete(":id")
  dissolve(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.hostAgenciesService.dissolveAgency(user.id, id);
  }

  @Post(":id/members/:userId/kick")
  kick(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Param("userId") targetUserId: string) {
    return this.hostAgenciesService.kickMember(user.id, id, targetUserId);
  }

  @Get(":id/dashboard")
  async getAgencyDashboard(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.assertOwner(user.id, id);
    return this.earnings.getAgencyDashboard(id);
  }

  @Get(":id/withdrawals")
  async listAgencyWithdrawals(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.withdrawals.listMyAgencyWithdrawals(id, user.id);
  }

  @Post(":id/withdrawals")
  createAgencyWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateAgencyWithdrawalDto,
  ) {
    return this.withdrawals.createAgencyWithdrawal(id, user.id, dto);
  }

  private async assertOwner(userId: string, agencyId: string) {
    const agency = await this.hostAgenciesService.getAgencyDetail(agencyId);
    if (agency.owner.id !== userId) {
      throw new ForbiddenException("Only the agency owner can view this");
    }
  }
}
