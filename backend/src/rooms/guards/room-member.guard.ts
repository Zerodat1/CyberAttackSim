import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Request } from "express";
import { RoomMemberRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

export interface RoomMemberRequest extends Request {
  user: AuthenticatedUser;
  roomMembership: { id: string; roomId: string; role: RoomMemberRole };
}

@Injectable()
export class RoomMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RoomMemberRequest>();
    const roomId = (request.params.id ?? request.params.roomId) as string;

    const membership = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: request.user.id } },
    });

    if (!membership) {
      throw new NotFoundException("You are not a member of this room");
    }
    if (membership.isBanned) {
      throw new ForbiddenException("You are banned from this room");
    }

    request.roomMembership = { id: membership.id, roomId: membership.roomId, role: membership.role };
    return true;
  }
}

const ROLE_RANK: Record<RoomMemberRole, number> = {
  OWNER: 4,
  CO_OWNER: 3,
  ADMIN: 2,
  MODERATOR: 1,
  MEMBER: 0,
};

export function roleAtLeast(role: RoomMemberRole, minimum: RoomMemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function roleOutranks(role: RoomMemberRole, other: RoomMemberRole): boolean {
  return ROLE_RANK[role] > ROLE_RANK[other];
}
