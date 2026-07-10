import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SendGiftDto {
  @ApiProperty({
    type: [String],
    description: "User IDs to send the gift to. Include your own ID to support yourself.",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsString({ each: true })
  recipientIds: string[];

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
