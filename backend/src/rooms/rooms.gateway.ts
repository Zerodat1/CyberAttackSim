import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { GameRound, Prisma, RoomEvent } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { authenticateSocket } from "../realtime/socket-auth.util";

interface AuthenticatedSocket extends Socket {
  data: { user: AuthenticatedUser };
}

type GiftSendWithRelations = Prisma.GiftSendGetPayload<{
  include: { sender: true; recipient: true; gift: true };
}>;

function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

@WebSocketGateway({ namespace: "/rooms", cors: { origin: "*" } })
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: AuthenticatedSocket, next) => {
      const user = await authenticateSocket(socket, this.jwt, this.config, this.prisma);
      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }
      socket.data.user = user;
      next();
    });
  }

  @SubscribeMessage("room:join")
  async onJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const membership = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: data.roomId, userId: client.data.user.id } },
    });

    if (!membership || membership.isBanned) {
      client.emit("room:error", { message: "You are not a member of this room" });
      return;
    }

    await client.join(roomChannel(data.roomId));
    client.emit("room:joined", { roomId: data.roomId });
  }

  @SubscribeMessage("room:leave")
  onLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.leave(roomChannel(data.roomId));
  }

  @OnEvent("room.event")
  broadcastRoomEvent(event: RoomEvent) {
    this.server.to(roomChannel(event.roomId)).emit("room:event", event);
  }

  @OnEvent("gift.sent")
  broadcastGiftSent(giftSend: GiftSendWithRelations) {
    if (giftSend.roomId) {
      this.server.to(roomChannel(giftSend.roomId)).emit("room:gift", giftSend);
    }
  }

  @OnEvent("game.round")
  broadcastGameRound(round: GameRound) {
    if (round.roomId) {
      this.server.to(roomChannel(round.roomId)).emit("room:game_round", round);
    }
  }

  @OnEvent("room.entrance")
  broadcastEntrance(payload: { roomId: string; userId: string; text: string; colorHex: string; emoji: string }) {
    this.server.to(roomChannel(payload.roomId)).emit("room:entrance", payload);
  }
}
