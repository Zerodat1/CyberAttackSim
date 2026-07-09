import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

export interface RechargeAgentRequest extends Request {
  user: AuthenticatedUser;
  rechargeAgent: {
    id: string;
    agencyId: string;
    role: "MASTER" | "SUB_AGENT";
    commissionRate: number;
  };
}

@Injectable()
export class RechargeAgentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RechargeAgentRequest>();

    const agent = await this.prisma.rechargeAgent.findUnique({
      where: { userId: request.user.id },
      include: { agency: true },
    });

    if (!agent || agent.status !== "ACTIVE" || agent.agency.status !== "ACTIVE") {
      throw new ForbiddenException("Active recharge agent access required");
    }

    request.rechargeAgent = {
      id: agent.id,
      agencyId: agent.agencyId,
      role: agent.role,
      commissionRate: Number(agent.commissionRate),
    };

    return true;
  }
}
