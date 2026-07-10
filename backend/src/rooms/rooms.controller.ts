import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { RoomMemberGuard, RoomMemberRequest } from "./guards/room-member.guard";
import { CurrentMembership } from "./decorators/current-membership.decorator";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { ChangeMemberRoleDto } from "./dto/change-member-role.dto";
import { MuteSeatDto, LockSeatDto } from "./dto/toggle.dto";

type Membership = RoomMemberRequest["roomMembership"];

@ApiTags("rooms")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(user.id, dto);
  }

  @Get()
  list() {
    return this.roomsService.listRooms();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.roomsService.getRoom(id);
  }

  @Post(":id/join")
  join(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: JoinRoomDto) {
    return this.roomsService.joinRoom(id, user.id, dto);
  }

  @UseGuards(RoomMemberGuard)
  @Get(":id/agora-token")
  getAgoraToken(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roomsService.getAgoraToken(id, user.id);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/leave")
  leave(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @CurrentMembership() membership: Membership) {
    return this.roomsService.leaveRoom(id, membership.id, user.id, membership.role);
  }

  @UseGuards(RoomMemberGuard)
  @Patch(":id")
  update(@Param("id") id: string, @CurrentMembership() membership: Membership, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, membership.role, dto);
  }

  @UseGuards(RoomMemberGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentMembership() membership: Membership) {
    return this.roomsService.deleteRoom(id, membership.role);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/seats/:seatNumber/take")
  takeSeat(
    @Param("id") id: string,
    @Param("seatNumber", ParseIntPipe) seatNumber: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.takeSeat(id, user.id, seatNumber);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/seats/leave")
  leaveSeat(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roomsService.leaveSeat(id, user.id);
  }

  @UseGuards(RoomMemberGuard)
  @Patch(":id/seats/:seatNumber/mute")
  muteSeat(
    @Param("id") id: string,
    @Param("seatNumber", ParseIntPipe) seatNumber: number,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentMembership() membership: Membership,
    @Body() dto: MuteSeatDto,
  ) {
    return this.roomsService.setSeatMute(id, user.id, membership.role, seatNumber, dto.muted);
  }

  @UseGuards(RoomMemberGuard)
  @Patch(":id/seats/:seatNumber/lock")
  lockSeat(
    @Param("id") id: string,
    @Param("seatNumber", ParseIntPipe) seatNumber: number,
    @CurrentMembership() membership: Membership,
    @Body() dto: LockSeatDto,
  ) {
    return this.roomsService.setSeatLock(id, membership.role, seatNumber, dto.locked);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/members/:userId/kick")
  kick(
    @Param("id") id: string,
    @Param("userId") targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentMembership() membership: Membership,
  ) {
    return this.roomsService.kickMember(id, user.id, membership.role, targetUserId);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/members/:userId/ban")
  ban(
    @Param("id") id: string,
    @Param("userId") targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentMembership() membership: Membership,
  ) {
    return this.roomsService.banMember(id, user.id, membership.role, targetUserId);
  }

  @UseGuards(RoomMemberGuard)
  @Post(":id/members/:userId/unban")
  unban(@Param("id") id: string, @Param("userId") targetUserId: string, @CurrentMembership() membership: Membership) {
    return this.roomsService.unbanMember(id, membership.role, targetUserId);
  }

  @UseGuards(RoomMemberGuard)
  @Patch(":id/members/:userId/role")
  changeRole(
    @Param("id") id: string,
    @Param("userId") targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentMembership() membership: Membership,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    return this.roomsService.changeMemberRole(id, user.id, membership.role, targetUserId, dto.role);
  }
}
