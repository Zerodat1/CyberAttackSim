import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

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
