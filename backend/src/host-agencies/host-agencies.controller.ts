import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { HostAgenciesService } from "./host-agencies.service";
import { CreateHostAgencyDto } from "./dto/create-host-agency.dto";
import { UpdateHostAgencyDto } from "./dto/update-host-agency.dto";

@ApiTags("host-agencies")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("host-agencies")
export class HostAgenciesController {
  constructor(private readonly hostAgenciesService: HostAgenciesService) {}

  @Get()
  list() {
    return this.hostAgenciesService.listAgencies();
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.hostAgenciesService.getMyMembership(user.id);
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.hostAgenciesService.getAgencyDetail(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHostAgencyDto) {
    return this.hostAgenciesService.createAgency(user.id, dto);
  }

  @Post(":id/join")
  join(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.hostAgenciesService.joinAgency(user.id, id);
  }

  @Post("leave")
  leave(@CurrentUser() user: AuthenticatedUser) {
    return this.hostAgenciesService.leaveAgency(user.id);
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
}
