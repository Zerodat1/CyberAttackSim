import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { StoreItemCategory } from "@prisma/client";

export class CreateStoreItemDto {
  @ApiProperty({ enum: StoreItemCategory })
  @IsEnum(StoreItemCategory)
  category: StoreItemCategory;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: "Emoji used to represent this item visually" })
  @IsString()
  emoji: string;

  @ApiProperty({ description: "Hex color used to tint the frame/bubble/glow" })
  @IsString()
  colorHex: string;

  @ApiProperty({ description: "Gold price" })
  @IsNumber()
  @Min(1)
  priceGold: number;

  @ApiPropertyOptional({ description: "Ownership duration in days; omit for a permanent item" })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}
