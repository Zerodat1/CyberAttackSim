import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateAgencyEconomyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: "Monthly diamond target the agency must reach to unlock the target commission rate" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTargetDiamonds?: number;
}
