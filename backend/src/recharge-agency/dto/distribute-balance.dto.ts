import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, Min } from "class-validator";

export class DistributeBalanceDto {
  @ApiProperty({ description: "Target sub-agent's RechargeAgent id" })
  @IsString()
  subAgentId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;
}
