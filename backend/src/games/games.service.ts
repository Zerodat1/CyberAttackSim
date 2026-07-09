import { randomInt } from "crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { PlayDiceDto } from "./dto/play-dice.dto";
import { UpdateGameSettingsDto } from "./dto/update-game-settings.dto";

const GAME_SETTINGS_ID = "dice_guess";
const GAME_ROUND_EVENT = "game.round";

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallet: WalletService,
    private readonly events: EventEmitter2,
  ) {}

  async getSettings() {
    return this.prisma.gameSettings.upsert({
      where: { id: GAME_SETTINGS_ID },
      update: {},
      create: { id: GAME_SETTINGS_ID },
    });
  }

  async updateSettings(dto: UpdateGameSettingsDto) {
    await this.getSettings();
    return this.prisma.gameSettings.update({ where: { id: GAME_SETTINGS_ID }, data: dto });
  }

  async playDiceGuess(playerId: string, dto: PlayDiceDto) {
    const settings = await this.getSettings();

    if (dto.betAmount < Number(settings.minBet) || dto.betAmount > Number(settings.maxBet)) {
      throw new BadRequestException(
        `Bet amount must be between ${settings.minBet} and ${settings.maxBet}`,
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const betToday = await this.prisma.gameRound.aggregate({
      where: { playerId, gameType: "DICE_GUESS", createdAt: { gte: startOfDay } },
      _sum: { betAmount: true },
    });
    const totalToday = Number(betToday._sum.betAmount ?? 0) + dto.betAmount;
    if (totalToday > Number(settings.dailyBetLimit)) {
      throw new BadRequestException("Daily betting limit exceeded");
    }

    const rolledNumber = randomInt(0, 10);
    const isWin = rolledNumber === dto.choice;
    const multiplier = Number(settings.winMultiplier);
    const payout = isWin ? round2(dto.betAmount * multiplier) : 0;

    const round = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitGold(playerId, dto.betAmount, tx);
      if (payout > 0) {
        await this.wallet.creditGold(playerId, payout, tx);
      }

      return tx.gameRound.create({
        data: {
          gameType: "DICE_GUESS",
          playerId,
          roomId: dto.roomId,
          betAmount: dto.betAmount,
          choice: dto.choice,
          rolledNumber,
          multiplier,
          payout,
          isWin,
        },
      });
    });

    this.events.emit(GAME_ROUND_EVENT, round);

    if (isWin) {
      await this.notifications.send(
        playerId,
        "GAME_WIN",
        "فزت في اللعبة!",
        `راهنت بـ ${dto.betAmount} وربحت ${payout} ذهب برقم ${rolledNumber}.`,
        { roundId: round.id },
      );
    }

    const wallet = await this.wallet.getOrCreateWallet(playerId);

    return { round, goldBalance: Number(wallet.goldBalance) };
  }

  async listHistory(playerId: string) {
    return this.prisma.gameRound.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
