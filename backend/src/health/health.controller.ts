import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import type Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.constants";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);

    const status = {
      status: database.status === "fulfilled" && redis.status === "fulfilled" ? "ok" : "degraded",
      database: database.status === "fulfilled" ? "up" : "down",
      redis: redis.status === "fulfilled" ? "up" : "down",
      timestamp: new Date().toISOString(),
    };

    if (status.status === "degraded") {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }
}
