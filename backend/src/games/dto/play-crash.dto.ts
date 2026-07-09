import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PlayCrashDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  betAmount: number;

  @ApiProperty({ description: "Auto cash-out multiplier, e.g. 2.5 for x2.50", minimum: 1.01 })
  @IsNumber()
  @Min(1.01)
  targetMultiplier: number;

  @ApiPropertyOptional({ description: "Room ID if played inside a voice room" })
  @IsOptional()
  @IsString()
  roomId?: string;
}
