import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { HostEarningsService } from "../host-agencies/host-earnings.service";
import { HostEconomySettingsService } from "../host-agencies/host-economy-settings.service";
import { CreateGiftDto } from "./dto/create-gift.dto";
import { UpdateGiftDto } from "./dto/update-gift.dto";
import { SendGiftDto } from "./dto/send-gift.dto";
import { pickWeightedMultiplier, WeightedOutcome } from "./utils/weighted-random";

const GIFT_SENT_EVENT = "gift.sent";

@Injectable()
export class GiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallet: WalletService,
    private readonly events: EventEmitter2,
    private readonly hostEarnings: HostEarningsService,
    private readonly economySettings: HostEconomySettingsService,
  ) {}

  async listCatalog() {
    return this.prisma.gift.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
  }

  async adminList() {
    return this.prisma.gift.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createGift(dto: CreateGiftDto) {
    const defaultShareRate = dto.diamondShareRate ?? Number((await this.economySettings.getSettings()).giftHostShareRate);
    return this.prisma.gift.create({
      data: {
        name: dto.name,
        iconUrl: dto.iconUrl,
        price: dto.price,
        type: dto.type,
        diamondShareRate: defaultShareRate,
        luckyOdds: dto.luckyOdds as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateGift(id: string, dto: UpdateGiftDto) {
    await this.getGiftOrThrow(id);
    return this.prisma.gift.update({ where: { id }, data: dto });
  }

  async sendGift(senderId: string, dto: SendGiftDto) {
    const recipientIds = Array.from(new Set(dto.recipientIds));

    const gift = await this.getGiftOrThrow(dto.giftId);
    if (!gift.isActive) {
      throw new BadRequestException("This gift is no longer available");
    }

    const recipientsCount = await this.prisma.user.count({ where: { id: { in: recipientIds } } });
    if (recipientsCount !== recipientIds.length) {
      throw new NotFoundException("One or more recipients not found");
    }

    const quantity = dto.quantity ?? 1;
    const totalGoldCostEach = round2(Number(gift.price) * quantity);
    const diamondsAwardedEach = round2(totalGoldCostEach * (Number(gift.diamondShareRate) / 100));
    const totalGoldCost = round2(totalGoldCostEach * recipientIds.length);
    const odds = gift.type === "LUCKY" ? (gift.luckyOdds as unknown as WeightedOutcome[]) : null;

    const giftSends = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitGold(senderId, totalGoldCost, tx);

      const created = [];
      for (const recipientId of recipientIds) {
        let luckyMultiplier: number | null = null;
        let luckyPayoutGold: number | null = null;

        if (odds) {
          luckyMultiplier = pickWeightedMultiplier(odds);
          luckyPayoutGold = round2(totalGoldCostEach * luckyMultiplier);
          await this.wallet.creditGold(senderId, luckyPayoutGold, tx);
        }

        await this.wallet.creditDiamond(recipientId, diamondsAwardedEach, tx);

        const giftSend = await tx.giftSend.create({
          data: {
            senderId,
            recipientId,
            giftId: gift.id,
            roomId: dto.roomId,
            quantity,
            totalGoldCost: totalGoldCostEach,
            diamondsAwarded: diamondsAwardedEach,
            isLucky: gift.type === "LUCKY",
            luckyMultiplier,
            luckyPayoutGold,
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
            recipient: { select: { id: true, username: true, avatarUrl: true } },
            gift: true,
          },
        });

        await this.hostEarnings.recordGiftEarnings(recipientId, diamondsAwardedEach, giftSend.id, tx, gift.type);

        created.push(giftSend);
      }

      return created;
    });

    for (const giftSend of giftSends) {
      this.events.emit(GIFT_SENT_EVENT, giftSend);

      await this.notifications.send(
        giftSend.recipientId,
        "GIFT_RECEIVED",
        "لقد استلمت هدية",
        `أرسل لك ${giftSend.sender.username} هدية "${gift.name}" وحصلت على ${diamondsAwardedEach} ألماسة.`,
        { giftSendId: giftSend.id },
      );

      const luckyPayoutGold = giftSend.luckyPayoutGold !== null ? Number(giftSend.luckyPayoutGold) : null;
      if (luckyPayoutGold !== null && giftSend.luckyMultiplier !== null && luckyPayoutGold > totalGoldCostEach) {
        await this.notifications.send(
          senderId,
          "GIFT_LUCKY_WIN",
          "هدية محظوظة!",
          `ربحت ${luckyPayoutGold} ذهب من إرسال هدية "${gift.name}" (مضاعف x${giftSend.luckyMultiplier}).`,
          { giftSendId: giftSend.id },
        );
      }
    }

    return giftSends;
  }

  async listHistory(userId: string, direction?: "sent" | "received") {
    const where =
      direction === "sent"
        ? { senderId: userId }
        : direction === "received"
          ? { recipientId: userId }
          : { OR: [{ senderId: userId }, { recipientId: userId }] };

    return this.prisma.giftSend.findMany({
      where,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        recipient: { select: { id: true, username: true, avatarUrl: true } },
        gift: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  private async getGiftOrThrow(id: string) {
    const gift = await this.prisma.gift.findUnique({ where: { id } });
    if (!gift) {
      throw new NotFoundException("Gift not found");
    }
    return gift;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
