import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateAgencyWithdrawalDto {
  @ApiProperty({ description: "Amount in USD to withdraw from the agency's accrued commission balance" })
  @IsNumber()
  @Min(1)
  usdAmount: number;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
