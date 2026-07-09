import { randomInt } from "crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { PlayDiceDto } from "./dto/play-dice.dto";
import { PlayWheelDto } from "./dto/play-wheel.dto";
import { PlaySlotsDto } from "./dto/play-slots.dto";
import { PlayCrashDto } from "./dto/play-crash.dto";
import { UpdateGameSettingsDto } from "./dto/update-game-settings.dto";

const GAME_ROUND_EVENT = "game.round";

interface WeightedTier {
  label: string;
  multiplier: number;
  weight: number;
}

const DEFAULT_WHEEL_SEGMENTS: WeightedTier[] = [
  { label: "x0", multiplier: 0, weight: 40 },
  { label: "x1.5", multiplier: 1.5, weight: 25 },
  { label: "x2", multiplier: 2, weight: 15 },
  { label: "x5", multiplier: 5, weight: 10 },
  { label: "x10", multiplier: 10, weight: 7 },
  { label: "x20", multiplier: 20, weight: 3 },
];

const DEFAULT_SLOT_TIERS: WeightedTier[] = [
  { label: "🍒 🍋 🍇", multiplier: 0, weight: 50 },
  { label: "🍋 🍋 🍋", multiplier: 1, weight: 25 },
  { label: "🍇 🍇 🍇", multiplier: 3, weight: 12 },
  { label: "⭐ ⭐ ⭐", multiplier: 8, weight: 8 },
  { label: "7️⃣ 7️⃣ 7️⃣", multiplier: 25, weight: 5 },
];

const DEFAULT_CRASH_CONFIG = { houseEdge: 0.03, maxMultiplier: 50 };

const SETTINGS_DEFAULTS: Record<GameType, { winMultiplier: number; config: Record<string, unknown> | null }> = {
  [GameType.DICE_GUESS]: { winMultiplier: 9, config: null },
  [GameType.LUCKY_WHEEL]: { winMultiplier: 1, config: { segments: DEFAULT_WHEEL_SEGMENTS } },
  [GameType.SLOT_MACHINE]: { winMultiplier: 1, config: { tiers: DEFAULT_SLOT_TIERS } },
  [GameType.CRASH_GUESS]: { winMultiplier: 1, config: DEFAULT_CRASH_CONFIG },
};

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallet: WalletService,
    private readonly events: EventEmitter2,
  ) {}

  async getSettings(gameType: GameType) {
    const defaults = SETTINGS_DEFAULTS[gameType];
    return this.prisma.gameSettings.upsert({
      where: { id: gameType },
      update: {},
      create: {
        id: gameType,
        winMultiplier: defaults.winMultiplier,
        config: (defaults.config ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async updateSettings(gameType: GameType, dto: UpdateGameSettingsDto) {
    await this.getSettings(gameType);
    return this.prisma.gameSettings.update({
      where: { id: gameType },
      data: { ...dto, config: dto.config as Prisma.InputJsonValue | undefined },
    });
  }

  private async assertBetAllowed(playerId: string, gameType: GameType, betAmount: number, settings: { minBet: Prisma.Decimal; maxBet: Prisma.Decimal; dailyBetLimit: Prisma.Decimal }) {
    if (betAmount < Number(settings.minBet) || betAmount > Number(settings.maxBet)) {
      throw new BadRequestException(`Bet amount must be between ${settings.minBet} and ${settings.maxBet}`);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const betToday = await this.prisma.gameRound.aggregate({
      where: { playerId, gameType, createdAt: { gte: startOfDay } },
      _sum: { betAmount: true },
    });
    const totalToday = Number(betToday._sum.betAmount ?? 0) + betAmount;
    if (totalToday > Number(settings.dailyBetLimit)) {
      throw new BadRequestException("Daily betting limit exceeded");
    }
  }

  private pickWeightedTier(tiers: WeightedTier[]): { index: number; tier: WeightedTier } {
    const totalWeight = tiers.reduce((sum, tier) => sum + tier.weight, 0);
    let roll = randomInt(0, totalWeight);
    for (let index = 0; index < tiers.length; index++) {
      const tier = tiers[index];
      if (roll < tier.weight) {
        return { index, tier };
      }
      roll -= tier.weight;
    }
    const lastIndex = tiers.length - 1;
    return { index: lastIndex, tier: tiers[lastIndex] };
  }

  private async finalizeRound(params: {
    playerId: string;
    gameType: GameType;
    roomId?: string;
    betAmount: number;
    choice: number;
    rolledNumber: number;
    multiplier: number;
    isWin: boolean;
  }) {
    const payout = params.isWin ? round2(params.betAmount * params.multiplier) : 0;

    const round = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitGold(params.playerId, params.betAmount, tx);
      if (payout > 0) {
        await this.wallet.creditGold(params.playerId, payout, tx);
      }

      return tx.gameRound.create({
        data: {
          gameType: params.gameType,
          playerId: params.playerId,
          roomId: params.roomId,
          betAmount: params.betAmount,
          choice: params.choice,
          rolledNumber: params.rolledNumber,
          multiplier: params.multiplier,
          payout,
          isWin: params.isWin,
        },
      });
    });

    this.events.emit(GAME_ROUND_EVENT, round);

    if (params.isWin) {
      await this.notifications.send(
        params.playerId,
        "GAME_WIN",
        "فزت في اللعبة!",
        `راهنت بـ ${params.betAmount} وربحت ${payout} ذهب.`,
        { roundId: round.id },
      );
    }

    const wallet = await this.wallet.getOrCreateWallet(params.playerId);
    return { round, goldBalance: Number(wallet.goldBalance) };
  }

  async playDiceGuess(playerId: string, dto: PlayDiceDto) {
    const settings = await this.getSettings(GameType.DICE_GUESS);
    await this.assertBetAllowed(playerId, GameType.DICE_GUESS, dto.betAmount, settings);

    const rolledNumber = randomInt(0, 10);
    const isWin = rolledNumber === dto.choice;
    const multiplier = Number(settings.winMultiplier);

    return this.finalizeRound({
      playerId,
      gameType: GameType.DICE_GUESS,
      roomId: dto.roomId,
      betAmount: dto.betAmount,
      choice: dto.choice,
      rolledNumber,
      multiplier,
      isWin,
    });
  }

  async playLuckyWheel(playerId: string, dto: PlayWheelDto) {
    const settings = await this.getSettings(GameType.LUCKY_WHEEL);
    await this.assertBetAllowed(playerId, GameType.LUCKY_WHEEL, dto.betAmount, settings);

    const segments = ((settings.config as { segments?: WeightedTier[] } | null)?.segments) ?? DEFAULT_WHEEL_SEGMENTS;
    const { index, tier } = this.pickWeightedTier(segments);

    return this.finalizeRound({
      playerId,
      gameType: GameType.LUCKY_WHEEL,
      roomId: dto.roomId,
      betAmount: dto.betAmount,
      choice: 0,
      rolledNumber: index,
      multiplier: tier.multiplier,
      isWin: tier.multiplier > 0,
    });
  }

  async playSlotMachine(playerId: string, dto: PlaySlotsDto) {
    const settings = await this.getSettings(GameType.SLOT_MACHINE);
    await this.assertBetAllowed(playerId, GameType.SLOT_MACHINE, dto.betAmount, settings);

    const tiers = ((settings.config as { tiers?: WeightedTier[] } | null)?.tiers) ?? DEFAULT_SLOT_TIERS;
    const { index, tier } = this.pickWeightedTier(tiers);

    return this.finalizeRound({
      playerId,
      gameType: GameType.SLOT_MACHINE,
      roomId: dto.roomId,
      betAmount: dto.betAmount,
      choice: 0,
      rolledNumber: index,
      multiplier: tier.multiplier,
      isWin: tier.multiplier > 0,
    });
  }

  async playCrash(playerId: string, dto: PlayCrashDto) {
    const settings = await this.getSettings(GameType.CRASH_GUESS);
    await this.assertBetAllowed(playerId, GameType.CRASH_GUESS, dto.betAmount, settings);

    const config = (settings.config as { houseEdge?: number; maxMultiplier?: number } | null) ?? DEFAULT_CRASH_CONFIG;
    const houseEdge = config.houseEdge ?? DEFAULT_CRASH_CONFIG.houseEdge;
    const maxMultiplier = config.maxMultiplier ?? DEFAULT_CRASH_CONFIG.maxMultiplier;

    if (dto.targetMultiplier < 1.01 || dto.targetMultiplier > maxMultiplier) {
      throw new BadRequestException(`Target multiplier must be between 1.01 and ${maxMultiplier}`);
    }

    // Provably-fair-style crash point: uniform random mapped through 1/(1-r), house-edge adjusted.
    const r = randomInt(0, 1_000_000) / 1_000_000;
    const rawCrashPoint = (1 - houseEdge) / (1 - r);
    const crashPoint = Math.min(maxMultiplier, Math.max(1, rawCrashPoint));

    const isWin = crashPoint >= dto.targetMultiplier;

    return this.finalizeRound({
      playerId,
      gameType: GameType.CRASH_GUESS,
      roomId: dto.roomId,
      betAmount: dto.betAmount,
      choice: Math.round(dto.targetMultiplier * 100),
      rolledNumber: Math.round(crashPoint * 100),
      multiplier: dto.targetMultiplier,
      isWin,
    });
  }

  async listHistory(playerId: string, gameType?: GameType) {
    return this.prisma.gameRound.findMany({
      where: { playerId, ...(gameType ? { gameType } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
