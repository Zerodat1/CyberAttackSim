import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { VipService } from "./vip.service";

@ApiTags("vip")
@Controller("vip")
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get("levels")
  listLevels() {
    return this.vipService.listLevels();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  myStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.vipService.myStatus(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("levels/:level/purchase")
  purchase(@CurrentUser() user: AuthenticatedUser, @Param("level", ParseIntPipe) level: number) {
    return this.vipService.purchase(user.id, level);
  }
}
