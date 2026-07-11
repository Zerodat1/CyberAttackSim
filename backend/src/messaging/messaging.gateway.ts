import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { Message } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { authenticateSocket } from "../realtime/socket-auth.util";

interface AuthenticatedSocket extends Socket {
  data: { user: AuthenticatedUser };
}

function userChannel(userId: string): string {
  return `user:${userId}`;
}

interface MessageCreatedPayload {
  conversationId: string;
  recipientId: string;
  senderId: string;
  message: Message;
}

interface MessageUpdatedPayload {
  conversationId: string;
  recipientId: string;
  message: Message;
}

@WebSocketGateway({ namespace: "/messaging", cors: { origin: "*" } })
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection {
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

  async handleConnection(client: AuthenticatedSocket) {
    await client.join(userChannel(client.data.user.id));
  }

  @SubscribeMessage("typing")
  onTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; recipientId: string },
  ) {
    this.server.to(userChannel(data.recipientId)).emit("typing", {
      conversationId: data.conversationId,
      userId: client.data.user.id,
    });
  }

  @OnEvent("message.created")
  handleMessageCreated(payload: MessageCreatedPayload) {
    this.server.to(userChannel(payload.recipientId)).emit("message:new", payload.message);
    this.server.to(userChannel(payload.senderId)).emit("message:new", payload.message);
  }

  @OnEvent("message.updated")
  handleMessageUpdated(payload: MessageUpdatedPayload) {
    this.server.to(userChannel(payload.message.senderId)).emit("message:updated", payload.message);
    this.server.to(userChannel(payload.recipientId)).emit("message:updated", payload.message);
  }
}
