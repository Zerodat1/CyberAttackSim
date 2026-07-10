import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateHostWithdrawalDto {
  @ApiProperty({ description: "Amount of diamonds to cash out" })
  @IsNumber()
  @Min(1)
  diamondsAmount: number;

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
