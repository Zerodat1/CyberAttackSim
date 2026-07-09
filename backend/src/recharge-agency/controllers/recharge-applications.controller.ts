import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApplicationStatus, GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { RechargeApplicationsService } from "../recharge-applications.service";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { ReviewApplicationDto } from "../dto/review-application.dto";

@ApiTags("recharge-agency-applications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("recharge-agency/applications")
export class RechargeApplicationsController {
  constructor(private readonly applications: RechargeApplicationsService) {}

  @Post()
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateApplicationDto) {
    return this.applications.apply(user.id, dto);
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applications.getMine(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER, GlobalRole.RECHARGE_MANAGER)
  @Get()
  list(@Query("status") status?: ApplicationStatus) {
    return this.applications.list(status);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER, GlobalRole.RECHARGE_MANAGER)
  @Patch(":id/review")
  review(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.applications.review(id, user.id, dto);
  }
}
