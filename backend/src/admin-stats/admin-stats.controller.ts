import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminStatsService } from "./admin-stats.service";

@ApiTags("admin-stats")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER, GlobalRole.RECHARGE_MANAGER, GlobalRole.ADMIN)
@Controller("admin-stats")
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get("overview")
  getOverview() {
    return this.adminStatsService.getOverview();
  }
}
