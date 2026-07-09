import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateWithdrawalRequestDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

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
