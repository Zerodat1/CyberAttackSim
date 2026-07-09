import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { GamesService } from "./games.service";
import { PlayDiceDto } from "./dto/play-dice.dto";
import { UpdateGameSettingsDto } from "./dto/update-game-settings.dto";

@ApiTags("games")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("games/dice")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("settings")
  getSettings() {
    return this.gamesService.getSettings();
  }

  @UseGuards(RolesGuard)
  @Roles(GlobalRole.OWNER)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gamesService.updateSettings(dto);
  }

  @Post("play")
  play(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlayDiceDto) {
    return this.gamesService.playDiceGuess(user.id, dto);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.gamesService.listHistory(user.id);
  }
}
