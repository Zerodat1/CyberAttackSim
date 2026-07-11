import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RejectHostAgentWithdrawalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
