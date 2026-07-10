import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { SKIP_IP_BAN_KEY } from "../decorators/skip-ip-ban.decorator";

@Injectable()
export class IpBanGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_IP_BAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip;
    if (!ip) {
      return true;
    }

    const banned = await this.prisma.bannedIp.findUnique({ where: { ipAddress: ip } });
    if (banned) {
      throw new ForbiddenException("Your IP address has been banned from this platform");
    }

    return true;
  }
}
