import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTopUpRequestDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: "Proof of payment URL/receipt" })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}
