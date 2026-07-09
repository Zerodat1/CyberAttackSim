import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import type { RequestContext } from "../auth/auth.service";
import { RegisterDto } from "../auth/dto/register.dto";
import { AdminInvitesService } from "./admin-invites.service";
import { CreateAdminInviteDto } from "./dto/create-admin-invite.dto";

function requestContext(req: Request): RequestContext {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@ApiTags("admin-invites")
@Controller("admin-invites")
export class AdminInvitesController {
  constructor(private readonly adminInvitesService: AdminInvitesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdminInviteDto) {
    return this.adminInvitesService.create(user.id, dto.expiresInHours);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Get()
  list() {
    return this.adminInvitesService.list();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Delete(":id")
  revoke(@Param("id") id: string) {
    return this.adminInvitesService.revoke(id);
  }

  @Get(":token/validate")
  validate(@Param("token") token: string) {
    return this.adminInvitesService.validate(token);
  }

  @Post(":token/register")
  register(@Param("token") token: string, @Body() dto: RegisterDto, @Req() req: Request) {
    return this.adminInvitesService.registerViaToken(token, dto, requestContext(req));
  }
}
