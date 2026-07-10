import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import * as argon2 from "argon2";
import { Prisma, RoomEventType, RoomMemberRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AgoraService } from "../agora/agora.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { roleAtLeast, roleOutranks } from "./guards/room-member.guard";

export interface RoomEventPayload {
  roomId: string;
  type: RoomEventType;
  actorId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}

const ROOM_EVENT = "room.event";
const ROOM_ENTRANCE_EVENT = "room.entrance";

const userWithCosmeticsSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  vipLevel: true,
  vipExpiresAt: true,
  activeFrame: { select: { emoji: true, colorHex: true } },
  activeMicEffect: { select: { emoji: true, colorHex: true } },
} as const;

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly events: EventEmitter2,
    private readonly agora: AgoraService,
  ) {}

  async getAgoraToken(roomId: string, userId: string) {
    const seat = await this.prisma.roomSeat.findFirst({ where: { roomId, occupantId: userId } });
    return this.agora.buildRtcToken(roomId, userId, !!seat);
  }

  private async emitEvent(payload: RoomEventPayload) {
    const event = await this.prisma.roomEvent.create({
      data: {
        roomId: payload.roomId,
        type: payload.type,
        actorId: payload.actorId,
        targetUserId: payload.targetUserId,
        metadata: payload.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    this.events.emit(ROOM_EVENT, event);
    return event;
  }

  async createRoom(ownerId: string, dto: CreateRoomDto) {
    if (dto.isPasswordProtected && !dto.password) {
      throw new BadRequestException("Password is required for password-protected rooms");
    }

    const seatCount = dto.seatCount ?? 8;

    const room = await this.prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          name: dto.name,
          ownerId,
          isPasswordProtected: dto.isPasswordProtected ?? false,
          passwordHash: dto.password ? await argon2.hash(dto.password) : null,
          seatCount,
        },
      });

      await tx.roomMember.create({
        data: { roomId: created.id, userId: ownerId, role: "OWNER" },
      });

      await tx.roomSeat.createMany({
        data: Array.from({ length: seatCount }, (_, index) => ({
          roomId: created.id,
          seatNumber: index + 1,
        })),
      });

      return created;
    });

    await this.emitEvent({ roomId: room.id, type: "ROOM_CREATED", actorId: ownerId });

    return room;
  }

  async listRooms() {
    return this.prisma.room.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isPasswordProtected: true,
        seatCount: true,
        createdAt: true,
        owner: { select: { id: true, username: true, fullName: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        seats: { orderBy: { seatNumber: "asc" }, include: { occupant: { select: userWithCosmeticsSelect } } },
        members: {
          where: { isBanned: false },
          include: { user: { select: userWithCosmeticsSelect } },
        },
      },
    });

    if (!room || !room.isActive) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  async updateRoom(roomId: string, actorRole: RoomMemberRole, dto: UpdateRoomDto) {
    if (!roleAtLeast(actorRole, "ADMIN")) {
      throw new ForbiddenException("Insufficient permissions to update this room");
    }

    if (dto.seatCount !== undefined && !roleAtLeast(actorRole, "OWNER")) {
      throw new ForbiddenException("Only the room owner can change the number of mic seats");
    }

    const data: { name?: string; isPasswordProtected?: boolean; passwordHash?: string | null; seatCount?: number } = {};
    if (dto.name) data.name = dto.name;
    if (dto.isPasswordProtected !== undefined) {
      data.isPasswordProtected = dto.isPasswordProtected;
      data.passwordHash = dto.isPasswordProtected && dto.password ? await argon2.hash(dto.password) : null;
    }

    if (dto.seatCount !== undefined) {
      await this.resizeSeats(roomId, dto.seatCount);
      data.seatCount = dto.seatCount;
    }

    const room = await this.prisma.room.update({ where: { id: roomId }, data });
    await this.emitEvent({ roomId, type: "ROOM_UPDATED" });
    return room;
  }

  private async resizeSeats(roomId: string, newSeatCount: number) {
    const currentSeats = await this.prisma.roomSeat.findMany({ where: { roomId } });
    const currentCount = currentSeats.length;

    if (newSeatCount > currentCount) {
      await this.prisma.roomSeat.createMany({
        data: Array.from({ length: newSeatCount - currentCount }, (_, index) => ({
          roomId,
          seatNumber: currentCount + index + 1,
        })),
      });
      return;
    }

    if (newSeatCount < currentCount) {
      const removedSeats = currentSeats.filter((seat) => seat.seatNumber > newSeatCount);
      for (const seat of removedSeats) {
        if (seat.occupantId) {
          await this.emitEvent({ roomId, type: "SEAT_LEFT", actorId: seat.occupantId, metadata: { seatNumber: seat.seatNumber } });
        }
      }
      await this.prisma.roomSeat.deleteMany({ where: { roomId, seatNumber: { gt: newSeatCount } } });
    }
  }

  async deleteRoom(roomId: string, actorRole: RoomMemberRole) {
    if (!roleAtLeast(actorRole, "OWNER")) {
      throw new ForbiddenException("Only the room owner can delete this room");
    }
    await this.prisma.room.update({ where: { id: roomId }, data: { isActive: false } });
  }

  async joinRoom(roomId: string, userId: string, dto: JoinRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
      throw new NotFoundException("Room not found");
    }

    const existingMembership = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (existingMembership?.isBanned) {
      throw new ForbiddenException("You are banned from this room");
    }
    if (existingMembership) {
      return existingMembership;
    }

    if (room.isPasswordProtected) {
      if (!dto.password || !room.passwordHash || !(await argon2.verify(room.passwordHash, dto.password))) {
        throw new ForbiddenException("Incorrect room password");
      }
    }

    const membership = await this.prisma.roomMember.create({
      data: { roomId, userId, role: "MEMBER" },
    });

    await this.emitEvent({ roomId, type: "MEMBER_JOINED", actorId: userId });

    const announcement = await this.getEntranceAnnouncement(userId);
    if (announcement) {
      this.events.emit(ROOM_ENTRANCE_EVENT, { roomId, userId, ...announcement });
    }

    return membership;
  }

  private async getEntranceAnnouncement(
    userId: string,
  ): Promise<{ text: string; colorHex: string; emoji: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        vipLevel: true,
        vipExpiresAt: true,
        activeEntrance: { select: { name: true, emoji: true, colorHex: true } },
      },
    });

    if (!user) {
      return null;
    }

    const vipActive = !!user.vipLevel && !!user.vipExpiresAt && user.vipExpiresAt > new Date();
    if (vipActive) {
      const vip = await this.prisma.vipLevel.findUnique({ where: { level: user.vipLevel! } });
      if (vip) {
        return { text: vip.entranceText, colorHex: vip.entranceColorHex, emoji: vip.frameEmoji };
      }
    }

    if (user.activeEntrance) {
      return {
        text: `${user.activeEntrance.emoji} دخل ${user.username} إلى الغرفة`,
        colorHex: user.activeEntrance.colorHex,
        emoji: user.activeEntrance.emoji,
      };
    }

    return null;
  }

  async leaveRoom(roomId: string, membershipId: string, userId: string, role: RoomMemberRole) {
    if (role === "OWNER") {
      throw new BadRequestException("Room owner cannot leave; delete the room or transfer ownership instead");
    }

    await this.prisma.$transaction([
      this.prisma.roomSeat.updateMany({
        where: { roomId, occupantId: userId },
        data: { occupantId: null, isMuted: false },
      }),
      this.prisma.roomMember.delete({ where: { id: membershipId } }),
    ]);

    await this.emitEvent({ roomId, type: "MEMBER_LEFT", actorId: userId });
  }

  async takeSeat(roomId: string, userId: string, seatNumber: number) {
    const seat = await this.prisma.roomSeat.findUnique({ where: { roomId_seatNumber: { roomId, seatNumber } } });
    if (!seat) {
      throw new NotFoundException("Seat not found");
    }
    if (seat.isLocked) {
      throw new ForbiddenException("This seat is locked");
    }
    if (seat.occupantId) {
      throw new BadRequestException("Seat is already occupied");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.roomSeat.updateMany({
        where: { roomId, occupantId: userId },
        data: { occupantId: null, isMuted: false },
      });
      return tx.roomSeat.update({
        where: { roomId_seatNumber: { roomId, seatNumber } },
        data: { occupantId: userId },
      });
    });

    await this.emitEvent({ roomId, type: "SEAT_TAKEN", actorId: userId, metadata: { seatNumber } });
    return updated;
  }

  async leaveSeat(roomId: string, userId: string) {
    const seat = await this.prisma.roomSeat.findFirst({ where: { roomId, occupantId: userId } });
    if (!seat) {
      throw new NotFoundException("You are not seated in this room");
    }

    const updated = await this.prisma.roomSeat.update({
      where: { id: seat.id },
      data: { occupantId: null, isMuted: false },
    });

    await this.emitEvent({ roomId, type: "SEAT_LEFT", actorId: userId, metadata: { seatNumber: seat.seatNumber } });
    return updated;
  }

  async setSeatMute(roomId: string, actorId: string, actorRole: RoomMemberRole, seatNumber: number, muted: boolean) {
    const seat = await this.prisma.roomSeat.findUnique({ where: { roomId_seatNumber: { roomId, seatNumber } } });
    if (!seat || !seat.occupantId) {
      throw new NotFoundException("Seat is empty");
    }

    if (seat.occupantId !== actorId && !roleAtLeast(actorRole, "MODERATOR")) {
      throw new ForbiddenException("Insufficient permissions to mute this seat");
    }

    const updated = await this.prisma.roomSeat.update({
      where: { id: seat.id },
      data: { isMuted: muted },
    });

    await this.emitEvent({
      roomId,
      type: muted ? "SEAT_MUTED" : "SEAT_UNMUTED",
      actorId,
      targetUserId: seat.occupantId,
      metadata: { seatNumber },
    });

    return updated;
  }

  async setSeatLock(roomId: string, actorRole: RoomMemberRole, seatNumber: number, locked: boolean) {
    if (!roleAtLeast(actorRole, "ADMIN")) {
      throw new ForbiddenException("Insufficient permissions to lock this seat");
    }

    const seat = await this.prisma.roomSeat.update({
      where: { roomId_seatNumber: { roomId, seatNumber } },
      data: { isLocked: locked, ...(locked ? { occupantId: null, isMuted: false } : {}) },
    });

    await this.emitEvent({ roomId, type: locked ? "SEAT_LOCKED" : "SEAT_UNLOCKED", metadata: { seatNumber } });
    return seat;
  }

  async kickMember(roomId: string, actorId: string, actorRole: RoomMemberRole, targetUserId: string) {
    const target = await this.getMembershipOrThrow(roomId, targetUserId);
    if (!roleAtLeast(actorRole, "MODERATOR") || !roleOutranks(actorRole, target.role)) {
      throw new ForbiddenException("Insufficient permissions to kick this member");
    }

    await this.prisma.$transaction([
      this.prisma.roomSeat.updateMany({ where: { roomId, occupantId: targetUserId }, data: { occupantId: null } }),
      this.prisma.roomMember.delete({ where: { id: target.id } }),
    ]);

    await this.emitEvent({ roomId, type: "MEMBER_KICKED", actorId, targetUserId });
    await this.notifications.send(targetUserId, "ROOM_KICKED", "تم إخراجك من الغرفة", "قام أحد المشرفين بإخراجك من الغرفة.");
  }

  async banMember(roomId: string, actorId: string, actorRole: RoomMemberRole, targetUserId: string) {
    const target = await this.getMembershipOrThrow(roomId, targetUserId);
    if (!roleAtLeast(actorRole, "ADMIN") || !roleOutranks(actorRole, target.role)) {
      throw new ForbiddenException("Insufficient permissions to ban this member");
    }

    await this.prisma.$transaction([
      this.prisma.roomSeat.updateMany({ where: { roomId, occupantId: targetUserId }, data: { occupantId: null } }),
      this.prisma.roomMember.update({ where: { id: target.id }, data: { isBanned: true } }),
    ]);

    await this.emitEvent({ roomId, type: "MEMBER_BANNED", actorId, targetUserId });
    await this.notifications.send(targetUserId, "ROOM_BANNED", "تم حظرك من الغرفة", "قام أحد المشرفين بحظرك من هذه الغرفة.");
  }

  async unbanMember(roomId: string, actorRole: RoomMemberRole, targetUserId: string) {
    if (!roleAtLeast(actorRole, "ADMIN")) {
      throw new ForbiddenException("Insufficient permissions to unban members");
    }

    const membership = await this.prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId: targetUserId } } });
    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    await this.prisma.roomMember.update({ where: { id: membership.id }, data: { isBanned: false } });
    await this.emitEvent({ roomId, type: "MEMBER_UNBANNED", targetUserId });
  }

  async changeMemberRole(
    roomId: string,
    actorId: string,
    actorRole: RoomMemberRole,
    targetUserId: string,
    newRole: Exclude<RoomMemberRole, "OWNER">,
  ) {
    const target = await this.getMembershipOrThrow(roomId, targetUserId);

    if (target.role === "OWNER") {
      throw new BadRequestException("Cannot change the role of the room owner");
    }
    if (newRole === "CO_OWNER" && actorRole !== "OWNER") {
      throw new ForbiddenException("Only the room owner can appoint a co-owner");
    }
    if (!roleAtLeast(actorRole, "CO_OWNER") || !roleOutranks(actorRole, target.role)) {
      throw new ForbiddenException("Insufficient permissions to change this member's role");
    }

    const updated = await this.prisma.roomMember.update({ where: { id: target.id }, data: { role: newRole } });
    await this.emitEvent({ roomId, type: "ROLE_CHANGED", actorId, targetUserId, metadata: { role: newRole } });
    await this.notifications.send(
      targetUserId,
      "ROOM_ROLE_CHANGED",
      "تم تغيير صلاحيتك في الغرفة",
      `أصبحت الآن ${newRole} في الغرفة.`,
    );
    return updated;
  }

  private async getMembershipOrThrow(roomId: string, userId: string) {
    const membership = await this.prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
    if (!membership) {
      throw new NotFoundException("Target user is not a member of this room");
    }
    return membership;
  }
}
