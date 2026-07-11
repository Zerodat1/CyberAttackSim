import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RoomMemberRequest } from "../guards/room-member.guard";

export const CurrentMembership = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RoomMemberRequest>();
  return request.roomMembership;
});
