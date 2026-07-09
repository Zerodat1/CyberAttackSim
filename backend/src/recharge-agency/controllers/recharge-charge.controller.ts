import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RechargeAgentGuard, RechargeAgentRequest } from "../guards/recharge-agent.guard";
import { CurrentAgent } from "../decorators/current-agent.decorator";
import { RechargeChargeService } from "../recharge-charge.service";
import { RechargeStatsService } from "../recharge-stats.service";
import { ChargeUserDto } from "../dto/charge-user.dto";

type Agent = RechargeAgentRequest["rechargeAgent"];

@ApiTags("recharge-agency-charge")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RechargeAgentGuard)
@Controller("recharge-agency")
export class RechargeChargeController {
  constructor(
    private readonly chargeService: RechargeChargeService,
    private readonly statsService: RechargeStatsService,
  ) {}

  @Post("charge")
  chargeUser(@CurrentAgent() agent: Agent, @Body() dto: ChargeUserDto, @Req() req: Request) {
    return this.chargeService.chargeUser(agent.id, dto, {
      ipAddress: req.ip,
      device: req.headers["user-agent"],
    });
  }

  @Get("transactions")
  listTransactions(@CurrentAgent() agent: Agent, @Query("targetUserId") targetUserId?: string) {
    return this.chargeService.listTransactions(agent.id, targetUserId);
  }

  @Get("dashboard")
  dashboard(@CurrentAgent() agent: Agent) {
    return this.statsService.getAgentDashboard(agent.id);
  }
}
