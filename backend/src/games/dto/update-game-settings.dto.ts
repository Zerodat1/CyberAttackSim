import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsObject, IsOptional, Min } from "class-validator";

export class UpdateGameSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBet?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBet?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  winMultiplier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyBetLimit?: number;

  @ApiPropertyOptional({ description: "Game-specific config, e.g. wheel segments or crash house edge" })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
