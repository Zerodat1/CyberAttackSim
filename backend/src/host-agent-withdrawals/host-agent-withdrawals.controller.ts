import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { HostAgentWithdrawalsService } from "./host-agent-withdrawals.service";
import { CreateHostAgentWithdrawalDto } from "./dto/create-host-agent-withdrawal.dto";

@ApiTags("host-agent-withdrawals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("agent-cashout")
export class HostAgentWithdrawalsController {
  constructor(private readonly service: HostAgentWithdrawalsService) {}

  @Get("agents")
  listAvailableAgents() {
    return this.service.listAvailableAgents();
  }

  @Post("requests")
  createRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHostAgentWithdrawalDto) {
    return this.service.createRequest(user.id, dto);
  }

  @Get("requests/mine")
  listMyRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMyRequests(user.id);
  }

  @Post("requests/:id/cancel")
  cancelRequest(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.cancelRequest(user.id, id);
  }

  @Post("requests/:id/confirm")
  confirmReceipt(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.confirmReceipt(user.id, id);
  }
}
