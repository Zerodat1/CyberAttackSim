import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";

export class ChargeUserDto {
  @ApiProperty({ description: "Target end-user ID to charge" })
  @IsString()
  targetUserId: string;

  @ApiPropertyOptional({
    description: "Recharge package ID to charge (applies the package's bonus). Overrides amount.",
  })
  @ValidateIf((o: ChargeUserDto) => !o.amount)
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({ description: "Custom amount in USD (no bonus applied). Ignored if packageId is set." })
  @ValidateIf((o: ChargeUserDto) => !o.packageId)
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "Client-generated idempotency key to prevent duplicate charges on retry",
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
