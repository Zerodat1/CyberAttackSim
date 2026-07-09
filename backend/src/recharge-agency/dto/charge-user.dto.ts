import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ChargeUserDto {
  @ApiProperty({ description: "Target end-user ID to charge" })
  @IsString()
  targetUserId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

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
