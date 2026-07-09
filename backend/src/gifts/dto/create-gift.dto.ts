import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export enum GiftTypeDto {
  STATIC = "STATIC",
  LUCKY = "LUCKY",
}

export class LuckyOddEntryDto {
  @ApiProperty({ description: "Payout multiplier applied to the gold spent" })
  @IsNumber()
  @Min(0)
  multiplier: number;

  @ApiProperty({ description: "Relative weight for this outcome in the random draw" })
  @IsNumber()
  @Min(0.01)
  weight: number;
}

export class CreateGiftDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ description: "Gold cost per unit" })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ enum: GiftTypeDto })
  @IsEnum(GiftTypeDto)
  type: GiftTypeDto;

  @ApiPropertyOptional({ description: "% of gold spent awarded to the recipient as diamonds", default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  diamondShareRate?: number;

  @ApiPropertyOptional({ type: [LuckyOddEntryDto], description: "Required when type is LUCKY" })
  @ValidateIf((o: CreateGiftDto) => o.type === GiftTypeDto.LUCKY)
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LuckyOddEntryDto)
  luckyOdds?: LuckyOddEntryDto[];
}
