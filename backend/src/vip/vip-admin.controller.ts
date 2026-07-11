import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { VipService } from "./vip.service";
import { UpdateVipLevelDto } from "./dto/update-vip-level.dto";

@ApiTags("vip-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@Controller("vip-admin")
export class VipAdminController {
  constructor(private readonly vipService: VipService) {}

  @Get("levels")
  list() {
    return this.vipService.adminList();
  }

  @Patch("levels/:level")
  update(@Param("level", ParseIntPipe) level: number, @Body() dto: UpdateVipLevelDto) {
    return this.vipService.updateLevel(level, dto);
  }
}
