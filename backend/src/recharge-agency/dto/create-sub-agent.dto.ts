import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSubAgentDto {
  @ApiProperty({ description: "Existing user's email, phone, or username" })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({ description: "Commission percentage for this sub-agent" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}
