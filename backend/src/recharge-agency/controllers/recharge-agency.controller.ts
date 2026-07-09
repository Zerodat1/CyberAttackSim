import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RechargeAgentGuard, RechargeAgentRequest } from "../guards/recharge-agent.guard";
import { CurrentAgent } from "../decorators/current-agent.decorator";
import { RechargeAgencyService } from "../recharge-agency.service";
import { CreateSubAgentDto } from "../dto/create-sub-agent.dto";
import { DistributeBalanceDto } from "../dto/distribute-balance.dto";

type Agent = RechargeAgentRequest["rechargeAgent"];

function requireMaster(agent: Agent) {
  if (agent.role !== "MASTER") {
    throw new ForbiddenException("Only the master recharge agency owner can perform this action");
  }
}

@ApiTags("recharge-agency-agents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RechargeAgentGuard)
@Controller("recharge-agency/agents")
export class RechargeAgencyController {
  constructor(private readonly agencyService: RechargeAgencyService) {}

  @Post()
  createSubAgent(@CurrentAgent() agent: Agent, @Body() dto: CreateSubAgentDto) {
    requireMaster(agent);
    return this.agencyService.createSubAgent(agent.id, agent.agencyId, dto);
  }

  @Get()
  listAgents(@CurrentAgent() agent: Agent) {
    return this.agencyService.listAgents(agent.agencyId);
  }

  @Patch(":id/suspend")
  suspend(@CurrentAgent() agent: Agent, @Param("id") id: string) {
    requireMaster(agent);
    return this.agencyService.setAgentStatus(agent.agencyId, id, "SUSPENDED");
  }

  @Patch(":id/activate")
  activate(@CurrentAgent() agent: Agent, @Param("id") id: string) {
    requireMaster(agent);
    return this.agencyService.setAgentStatus(agent.agencyId, id, "ACTIVE");
  }

  @Post("distribute")
  distribute(@CurrentAgent() agent: Agent, @Body() dto: DistributeBalanceDto) {
    requireMaster(agent);
    return this.agencyService.distributeBalance(agent.id, agent.agencyId, dto);
  }
}
