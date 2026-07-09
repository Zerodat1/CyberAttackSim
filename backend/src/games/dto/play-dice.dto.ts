import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class PlayDiceDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  betAmount: number;

  @ApiProperty({ description: "Guessed number between 0 and 9", minimum: 0, maximum: 9 })
  @IsInt()
  @Min(0)
  @Max(9)
  choice: number;

  @ApiPropertyOptional({ description: "Room ID if played inside a voice room" })
  @IsOptional()
  @IsString()
  roomId?: string;
}
