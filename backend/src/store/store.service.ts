import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { StoreItemCategory } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { CreateStoreItemDto } from "./dto/create-store-item.dto";
import { UpdateStoreItemDto } from "./dto/update-store-item.dto";
import { EquipStoreItemDto } from "./dto/equip-store-item.dto";

const ACTIVE_FIELD_BY_CATEGORY: Record<StoreItemCategory, "activeFrameId" | "activeEntranceId" | "activeBubbleId" | "activeMicEffectId"> = {
  FRAME: "activeFrameId",
  ENTRANCE: "activeEntranceId",
  BUBBLE: "activeBubbleId",
  MIC_EFFECT: "activeMicEffectId",
};

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async listCatalog(userId: string, category?: StoreItemCategory) {
    const [items, owned] = await Promise.all([
      this.prisma.storeItem.findMany({
        where: { isActive: true, category },
        orderBy: { priceGold: "asc" },
      }),
      this.prisma.userStoreItem.findMany({ where: { userId } }),
    ]);

    const ownedByItemId = new Map(owned.map((entry) => [entry.storeItemId, entry]));

    return items.map((item) => {
      const ownership = ownedByItemId.get(item.id);
      const expired = ownership?.expiresAt ? ownership.expiresAt < new Date() : false;
      return {
        ...item,
        owned: !!ownership && !expired,
        expiresAt: ownership?.expiresAt ?? null,
      };
    });
  }

  async myInventory(userId: string) {
    const [ownedItems, user] = await Promise.all([
      this.prisma.userStoreItem.findMany({
        where: { userId },
        include: { storeItem: true },
        orderBy: { purchasedAt: "desc" },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { activeFrameId: true, activeEntranceId: true, activeBubbleId: true, activeMicEffectId: true },
      }),
    ]);

    return {
      items: ownedItems.map((entry) => ({
        ...entry.storeItem,
        purchasedAt: entry.purchasedAt,
        expiresAt: entry.expiresAt,
        expired: entry.expiresAt ? entry.expiresAt < new Date() : false,
      })),
      equipped: user,
    };
  }

  async purchase(userId: string, itemId: string) {
    const item = await this.prisma.storeItem.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) {
      throw new NotFoundException("Store item not found");
    }

    const existing = await this.prisma.userStoreItem.findUnique({
      where: { userId_storeItemId: { userId, storeItemId: itemId } },
    });
    if (existing && (!existing.expiresAt || existing.expiresAt > new Date())) {
      throw new ConflictException("You already own this item");
    }

    const expiresAt = item.durationDays
      ? new Date(Date.now() + item.durationDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.$transaction(async (tx) => {
      await this.wallet.debitGold(userId, Number(item.priceGold), tx);

      return tx.userStoreItem.upsert({
        where: { userId_storeItemId: { userId, storeItemId: itemId } },
        update: { purchasedAt: new Date(), expiresAt },
        create: { userId, storeItemId: itemId, expiresAt },
        include: { storeItem: true },
      });
    });
  }

  async equip(userId: string, dto: EquipStoreItemDto) {
    const field = ACTIVE_FIELD_BY_CATEGORY[dto.category];
    const select = {
      activeFrameId: true,
      activeEntranceId: true,
      activeBubbleId: true,
      activeMicEffectId: true,
    } as const;

    if (!dto.storeItemId) {
      return this.prisma.user.update({ where: { id: userId }, data: { [field]: null }, select });
    }

    const ownership = await this.prisma.userStoreItem.findUnique({
      where: { userId_storeItemId: { userId, storeItemId: dto.storeItemId } },
      include: { storeItem: true },
    });

    if (!ownership || (ownership.expiresAt && ownership.expiresAt < new Date())) {
      throw new BadRequestException("You do not own this item, or it has expired");
    }

    if (ownership.storeItem.category !== dto.category) {
      throw new BadRequestException("Item category mismatch");
    }

    return this.prisma.user.update({ where: { id: userId }, data: { [field]: dto.storeItemId }, select });
  }

  adminList() {
    return this.prisma.storeItem.findMany({ orderBy: [{ category: "asc" }, { priceGold: "asc" }] });
  }

  createItem(dto: CreateStoreItemDto) {
    return this.prisma.storeItem.create({ data: dto });
  }

  async updateItem(id: string, dto: UpdateStoreItemDto) {
    await this.getItemOrThrow(id);
    return this.prisma.storeItem.update({ where: { id }, data: dto });
  }

  private async getItemOrThrow(id: string) {
    const item = await this.prisma.storeItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException("Store item not found");
    }
    return item;
  }
}
