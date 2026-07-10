import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, Min } from "class-validator";

export class CreateRechargePackageDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  priceUsd: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  baseGold: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  bonusPercent: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}
