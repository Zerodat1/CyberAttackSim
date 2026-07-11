import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class SubmitPaymentProofDto {
  @ApiProperty({ description: "URL of the uploaded payment receipt/screenshot" })
  @IsString()
  proofUrl: string;

  @ApiPropertyOptional({ description: "Transaction number/reference for the transfer" })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}
