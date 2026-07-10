import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, Min } from "class-validator";

export class CreateHostTargetTierDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  thresholdDiamonds: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salaryUsd: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}
