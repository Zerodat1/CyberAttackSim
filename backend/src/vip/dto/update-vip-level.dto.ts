import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateVipLevelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  priceGold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frameColorHex?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frameEmoji?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entranceText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entranceColorHex?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
