import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateHostEconomySettingsDto {
  @ApiPropertyOptional({ description: "Percentage of a gift's gold value credited to the host as diamonds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  giftHostShareRate?: number;

  @ApiPropertyOptional({ description: "Base agency commission rate %" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  agencyBaseRate?: number;

  @ApiPropertyOptional({ description: "Agency commission rate % once the monthly target is reached" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  agencyTargetRate?: number;

  @ApiPropertyOptional({ description: "Agency commission rate % for premium agencies" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  agencyPremiumRate?: number;

  @ApiPropertyOptional({ description: "USD value of a single diamond when a host cashes out" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  diamondToUsdRate?: number;
}
