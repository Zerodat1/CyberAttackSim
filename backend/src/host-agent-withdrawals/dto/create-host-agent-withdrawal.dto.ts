import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, Min } from "class-validator";

export class CreateHostAgentWithdrawalDto {
  @ApiProperty({ description: "ID of the recharge agent the host wants to cash out through" })
  @IsString()
  rechargeAgentId: string;

  @ApiProperty({ description: "Amount of diamonds to cash out" })
  @IsNumber()
  @Min(1)
  diamondsAmount: number;

  @ApiProperty({ description: "Payout method, e.g. bank transfer, ZainCash, USDT" })
  @IsString()
  payoutMethod: string;

  @ApiProperty({ description: "Account/number/wallet address the agent should pay to" })
  @IsString()
  payoutAccount: string;
}
