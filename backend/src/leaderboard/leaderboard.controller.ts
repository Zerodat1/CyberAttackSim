import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LeaderboardPeriod, LeaderboardService, LeaderboardType } from "./leaderboard.service";

const TYPES: LeaderboardType[] = ["ROOM", "WEALTH", "CHARM"];
const PERIODS: LeaderboardPeriod[] = ["DAY", "WEEK", "MONTH"];

@ApiTags("leaderboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  get(@Query("type") type?: string, @Query("period") period?: string) {
    const resolvedType = (type?.toUpperCase() ?? "WEALTH") as LeaderboardType;
    const resolvedPeriod = (period?.toUpperCase() ?? "DAY") as LeaderboardPeriod;

    if (!TYPES.includes(resolvedType)) {
      throw new BadRequestException("Invalid leaderboard type");
    }
    if (!PERIODS.includes(resolvedPeriod)) {
      throw new BadRequestException("Invalid leaderboard period");
    }

    return this.leaderboardService.getLeaderboard(resolvedType, resolvedPeriod);
  }
}
