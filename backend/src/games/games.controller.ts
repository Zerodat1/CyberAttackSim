import { Body, Controller, Get, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GameType, GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { GamesService } from "./games.service";
import { PlayDiceDto } from "./dto/play-dice.dto";
import { PlayWheelDto } from "./dto/play-wheel.dto";
import { PlaySlotsDto } from "./dto/play-slots.dto";
import { PlayCrashDto } from "./dto/play-crash.dto";
import { UpdateGameSettingsDto } from "./dto/update-game-settings.dto";

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games/dice")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("settings")
  getSettings() {
    return this.gamesService.getSettings(GameType.DICE_GUESS);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gamesService.updateSettings(GameType.DICE_GUESS, dto);
  }

  @Post("play")
  play(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlayDiceDto) {
    return this.gamesService.playDiceGuess(user.id, dto);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.gamesService.listHistory(user.id, GameType.DICE_GUESS);
  }
}

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games/wheel")
export class WheelGamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("settings")
  getSettings() {
    return this.gamesService.getSettings(GameType.LUCKY_WHEEL);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gamesService.updateSettings(GameType.LUCKY_WHEEL, dto);
  }

  @Post("play")
  play(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlayWheelDto) {
    return this.gamesService.playLuckyWheel(user.id, dto);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.gamesService.listHistory(user.id, GameType.LUCKY_WHEEL);
  }
}

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games/slots")
export class SlotsGamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("settings")
  getSettings() {
    return this.gamesService.getSettings(GameType.SLOT_MACHINE);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gamesService.updateSettings(GameType.SLOT_MACHINE, dto);
  }

  @Post("play")
  play(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlaySlotsDto) {
    return this.gamesService.playSlotMachine(user.id, dto);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.gamesService.listHistory(user.id, GameType.SLOT_MACHINE);
  }
}

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games/crash")
export class CrashGamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("settings")
  getSettings() {
    return this.gamesService.getSettings(GameType.CRASH_GUESS);
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gamesService.updateSettings(GameType.CRASH_GUESS, dto);
  }

  @Post("play")
  play(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlayCrashDto) {
    return this.gamesService.playCrash(user.id, dto);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.gamesService.listHistory(user.id, GameType.CRASH_GUESS);
  }
}

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games")
export class GamesHistoryController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser, @Query("gameType") gameType?: GameType) {
    return this.gamesService.listHistory(user.id, gameType);
  }
}
