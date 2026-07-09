import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SendGiftDto {
  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiProperty()
  @IsString()
  giftId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @ApiPropertyOptional({ description: "Room ID if the gift is sent inside a voice room" })
  @IsOptional()
  @IsString()
  roomId?: string;
}
