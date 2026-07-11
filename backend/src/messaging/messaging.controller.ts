import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { MessagingService } from "./messaging.service";
import { StartConversationDto } from "./dto/start-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { EditMessageDto } from "./dto/edit-message.dto";
import { ForwardMessageDto } from "./dto/forward-message.dto";
import { ReportMessageDto } from "./dto/report-message.dto";
import { TogglePinDto, ToggleMuteDto } from "./dto/toggle-conversation.dto";

@ApiTags("messaging")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("messaging")
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post("conversations")
  startConversation(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartConversationDto) {
    return this.messagingService.getOrCreateConversation(user.id, dto.targetUserId);
  }

  @Get("conversations")
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.listConversations(user.id);
  }

  @Get("conversations/:id/messages")
  getMessages(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query("before") before?: string,
  ) {
    return this.messagingService.getMessages(user.id, id, before);
  }

  @Post("conversations/:id/messages")
  sendMessage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(user.id, id, dto);
  }

  @Post("conversations/:id/read")
  markAsRead(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { messageId: string },
  ) {
    return this.messagingService.markAsRead(user.id, id, body.messageId);
  }

  @Patch("conversations/:id/pin")
  pin(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: TogglePinDto) {
    return this.messagingService.togglePin(user.id, id, dto.pinned);
  }

  @Patch("conversations/:id/mute")
  mute(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ToggleMuteDto) {
    return this.messagingService.toggleMute(user.id, id, dto.muted);
  }

  @Get("search")
  search(@CurrentUser() user: AuthenticatedUser, @Query("q") query: string) {
    return this.messagingService.searchMessages(user.id, query);
  }

  @Patch("messages/:id")
  editMessage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: EditMessageDto) {
    return this.messagingService.editMessage(user.id, id, dto);
  }

  @Delete("messages/:id")
  deleteMessage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.deleteMessage(user.id, id);
  }

  @Post("messages/:id/forward")
  forwardMessage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ForwardMessageDto) {
    return this.messagingService.forwardMessage(user.id, id, dto.targetConversationId);
  }

  @Post("messages/:id/report")
  reportMessage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ReportMessageDto) {
    return this.messagingService.reportMessage(user.id, id, dto);
  }

  @Post("block/:userId")
  block(@Param("userId") targetUserId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.blockUser(user.id, targetUserId);
  }

  @Delete("block/:userId")
  unblock(@Param("userId") targetUserId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.unblockUser(user.id, targetUserId);
  }
}
