import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "./notifications.service";
import { FcmService } from "./fcm.service";
import { RegisterDeviceTokenDto } from "./dto/register-device-token.dto";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly fcm: FcmService,
  ) {}

  @Post("device-token")
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerDeviceToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceTokenDto) {
    await this.fcm.registerToken(user.id, dto.token, dto.platform);
  }

  @Delete("device-token/:token")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterDeviceToken(@CurrentUser() user: AuthenticatedUser, @Param("token") token: string) {
    await this.fcm.unregisterToken(token, user.id);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("unreadOnly") unreadOnly?: string) {
    return this.notifications.listForUser(user.id, unreadOnly === "true");
  }

  @Patch(":id/read")
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notifications.markAsRead(user.id, id);
  }

  @Patch("read-all")
  markAllAsRead(@CurrentUser() user: AuthenticatedUser, @Body() _body: Record<string, never>) {
    return this.notifications.markAllAsRead(user.id);
  }
}
