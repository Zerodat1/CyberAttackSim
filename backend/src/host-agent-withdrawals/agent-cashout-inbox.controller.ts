import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HostAgentWithdrawalStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RechargeAgentGuard, RechargeAgentRequest } from "../recharge-agency/guards/recharge-agent.guard";
import { CurrentAgent } from "../recharge-agency/decorators/current-agent.decorator";
import { HostAgentWithdrawalsService } from "./host-agent-withdrawals.service";
import { SubmitPaymentProofDto } from "./dto/submit-payment-proof.dto";
import { RejectHostAgentWithdrawalDto } from "./dto/reject-host-agent-withdrawal.dto";

type Agent = RechargeAgentRequest["rechargeAgent"];

@ApiTags("host-agent-withdrawals-agent-inbox")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RechargeAgentGuard)
@Controller("agent-cashout/agent")
export class AgentCashoutInboxController {
  constructor(private readonly service: HostAgentWithdrawalsService) {}

  @Get("requests")
  listInbox(@CurrentAgent() agent: Agent, @Query("status") status?: HostAgentWithdrawalStatus) {
    return this.service.listAgentInbox(agent.id, status);
  }

  @Post("requests/:id/accept")
  accept(@CurrentAgent() agent: Agent, @Param("id") id: string) {
    return this.service.acceptRequest(agent.id, id);
  }

  @Post("requests/:id/reject")
  reject(@CurrentAgent() agent: Agent, @Param("id") id: string, @Body() dto: RejectHostAgentWithdrawalDto) {
    return this.service.rejectRequest(agent.id, id, dto);
  }

  @Post("requests/:id/pay")
  submitProof(@CurrentAgent() agent: Agent, @Param("id") id: string, @Body() dto: SubmitPaymentProofDto) {
    return this.service.submitProof(agent.id, id, dto);
  }
}
