import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PlaySlotsDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  betAmount: number;

  @ApiPropertyOptional({ description: "Room ID if played inside a voice room" })
  @IsOptional()
  @IsString()
  roomId?: string;
}
