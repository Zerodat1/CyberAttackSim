import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { EditMessageDto } from "./dto/edit-message.dto";
import { ReportMessageDto } from "./dto/report-message.dto";

const MESSAGE_CREATED_EVENT = "message.created";
const MESSAGE_UPDATED_EVENT = "message.updated";

function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly events: EventEmitter2,
  ) {}

  async getOrCreateConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException("Cannot start a conversation with yourself");
    }

    await this.assertNotBlocked(userId, targetUserId);

    const [userAId, userBId] = orderPair(userId, targetUserId);

    const existing = await this.prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({ data: { userAId, userBId } });
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { updatedAt: "desc" },
      include: {
        userA: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        settings: { where: { userId } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return conversations.map((conversation) => {
      const otherUser = conversation.userAId === userId ? conversation.userB : conversation.userA;
      const setting = conversation.settings[0];
      return {
        id: conversation.id,
        otherUser,
        lastMessage: conversation.messages[0] ?? null,
        isPinned: setting?.isPinned ?? false,
        isMuted: setting?.isMuted ?? false,
        updatedAt: conversation.updatedAt,
      };
    });
  }

  async getMessages(userId: string, conversationId: string, before?: string) {
    await this.assertParticipant(userId, conversationId);

    return this.prisma.message.findMany({
      where: { conversationId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true, activeBubble: { select: { emoji: true, colorHex: true } } } },
        replyTo: { select: { id: true, body: true, senderId: true } },
      },
    });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.assertParticipant(userId, conversationId);
    const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;

    await this.assertNotBlocked(userId, recipientId);

    if (dto.replyToId) {
      const replyTarget = await this.prisma.message.findUnique({ where: { id: dto.replyToId } });
      if (!replyTarget || replyTarget.conversationId !== conversationId) {
        throw new BadRequestException("Cannot reply to a message outside this conversation");
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          body: dto.body,
          replyToId: dto.replyToId,
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true, activeBubble: { select: { emoji: true, colorHex: true } } } },
          replyTo: { select: { id: true, body: true, senderId: true } },
        },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return created;
    });

    this.events.emit(MESSAGE_CREATED_EVENT, { conversationId, recipientId, senderId: userId, message });

    const recipientSetting = await this.prisma.conversationSetting.findUnique({
      where: { conversationId_userId: { conversationId, userId: recipientId } },
    });
    if (!recipientSetting?.isMuted) {
      await this.notifications.send(recipientId, "NEW_MESSAGE", "رسالة جديدة", dto.body.slice(0, 120), {
        conversationId,
      });
    }

    return message;
  }

  async editMessage(userId: string, messageId: string, dto: EditMessageDto) {
    const message = await this.getOwnedMessageOrThrow(userId, messageId);
    if (message.isDeleted) {
      throw new BadRequestException("Cannot edit a deleted message");
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { body: dto.body, isEdited: true },
    });

    this.events.emit(MESSAGE_UPDATED_EVENT, {
      conversationId: message.conversationId,
      recipientId: await this.getOtherParticipantId(message.conversationId, userId),
      message: updated,
    });

    return updated;
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.getOwnedMessageOrThrow(userId, messageId);

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, body: "" },
    });

    this.events.emit(MESSAGE_UPDATED_EVENT, {
      conversationId: message.conversationId,
      recipientId: await this.getOtherParticipantId(message.conversationId, userId),
      message: updated,
    });

    return updated;
  }

  private async getOtherParticipantId(conversationId: string, userId: string): Promise<string> {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    return conversation.userAId === userId ? conversation.userBId : conversation.userAId;
  }

  async forwardMessage(userId: string, messageId: string, targetConversationId: string) {
    const original = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!original || original.isDeleted) {
      throw new NotFoundException("Message not found");
    }
    await this.assertParticipant(userId, original.conversationId);

    return this.sendForwardedMessage(userId, targetConversationId, original.body, original.id);
  }

  private async sendForwardedMessage(
    userId: string,
    conversationId: string,
    body: string,
    forwardedFromId: string,
  ) {
    const conversation = await this.assertParticipant(userId, conversationId);
    const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    await this.assertNotBlocked(userId, recipientId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body, forwardedFromId },
      include: { sender: { select: { id: true, username: true, avatarUrl: true, activeBubble: { select: { emoji: true, colorHex: true } } } } },
    });

    this.events.emit(MESSAGE_CREATED_EVENT, { conversationId, recipientId, senderId: userId, message });
    return message;
  }

  async searchMessages(userId: string, query: string) {
    return this.prisma.message.findMany({
      where: {
        isDeleted: false,
        body: { contains: query, mode: "insensitive" },
        conversation: { OR: [{ userAId: userId }, { userBId: userId }] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markAsRead(userId: string, conversationId: string, messageId: string) {
    await this.assertParticipant(userId, conversationId);

    await this.prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId },
    });

    await this.prisma.conversationSetting.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { lastReadMessageId: messageId },
      create: { conversationId, userId, lastReadMessageId: messageId },
    });
  }

  async togglePin(userId: string, conversationId: string, pinned: boolean) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.conversationSetting.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { isPinned: pinned },
      create: { conversationId, userId, isPinned: pinned },
    });
  }

  async toggleMute(userId: string, conversationId: string, muted: boolean) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.conversationSetting.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { isMuted: muted },
      create: { conversationId, userId, isMuted: muted },
    });
  }

  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException("Cannot block yourself");
    }
    return this.prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
      update: {},
      create: { blockerId: userId, blockedId: targetUserId },
    });
  }

  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.blockedUser.deleteMany({ where: { blockerId: userId, blockedId: targetUserId } });
  }

  async reportMessage(userId: string, messageId: string, dto: ReportMessageDto) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    await this.assertParticipant(userId, message.conversationId);

    return this.prisma.messageReport.create({
      data: { messageId, reporterId: userId, reason: dto.reason },
    });
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }
    return conversation;
  }

  private async getOwnedMessageOrThrow(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only modify your own messages");
    }
    return message;
  }

  private async assertNotBlocked(userId: string, otherUserId: string) {
    const block = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException("Messaging is blocked between these users");
    }
  }
}
