import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RechargeAgentGuard, RechargeAgentRequest } from "../guards/recharge-agent.guard";
import { CurrentAgent } from "../decorators/current-agent.decorator";
import { RechargeWalletService } from "../recharge-wallet.service";
import { CreateTopUpRequestDto } from "../dto/create-topup-request.dto";
import { CreateWithdrawalRequestDto } from "../dto/create-withdrawal-request.dto";

type Agent = RechargeAgentRequest["rechargeAgent"];

@ApiTags("recharge-agency-wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RechargeAgentGuard)
@Controller("recharge-agency/wallet")
export class RechargeWalletController {
  constructor(private readonly walletService: RechargeWalletService) {}

  @Get()
  getWallet(@CurrentAgent() agent: Agent) {
    return this.walletService.getWallet(agent.id);
  }

  @Post("topup-requests")
  createTopUpRequest(@CurrentAgent() agent: Agent, @Body() dto: CreateTopUpRequestDto) {
    return this.walletService.createTopUpRequest(agent.id, dto);
  }

  @Get("topup-requests")
  listTopUpRequests(@CurrentAgent() agent: Agent) {
    return this.walletService.listTopUpRequests(agent.id);
  }

  @Post("withdrawals")
  createWithdrawalRequest(@CurrentAgent() agent: Agent, @Body() dto: CreateWithdrawalRequestDto) {
    return this.walletService.createWithdrawalRequest(agent.id, dto);
  }

  @Get("withdrawals")
  listWithdrawalRequests(@CurrentAgent() agent: Agent) {
    return this.walletService.listWithdrawalRequests(agent.id);
  }
}
