import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RechargeAgentRequest } from "../guards/recharge-agent.guard";

export const CurrentAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RechargeAgentRequest>();
    return request.rechargeAgent;
  },
);
