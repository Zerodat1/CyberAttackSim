import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { SkipIpBan } from "../common/decorators/skip-ip-ban.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { AdminUsersService } from "./admin-users.service";
import { BanUserDto } from "./dto/ban-user.dto";
import { BanIpDto } from "./dto/ban-ip.dto";

@ApiTags("admin-users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@SkipIpBan()
@Controller("admin-users")
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  list(@Query("search") search?: string, @Query("page") page?: string) {
    return this.adminUsersService.listUsers(search, page ? parseInt(page, 10) : 1);
  }

  @Patch(":id/ban")
  ban(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: BanUserDto) {
    return this.adminUsersService.banUser(id, user.id, dto.reason);
  }

  @Patch(":id/unban")
  unban(@Param("id") id: string) {
    return this.adminUsersService.unbanUser(id);
  }

  @Get("banned-ips")
  listBannedIps() {
    return this.adminUsersService.listBannedIps();
  }

  @Post("banned-ips")
  banIp(@CurrentUser() user: AuthenticatedUser, @Body() dto: BanIpDto, @Req() req: Request) {
    return this.adminUsersService.banIp(dto, user.id, req.ip);
  }

  @Delete("banned-ips/:id")
  unbanIp(@Param("id") id: string) {
    return this.adminUsersService.unbanIp(id);
  }
}
