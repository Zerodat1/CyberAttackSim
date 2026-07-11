import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RechargeAgencyModule } from "./recharge-agency/recharge-agency.module";
import { RoomsModule } from "./rooms/rooms.module";
import { MessagingModule } from "./messaging/messaging.module";
import { WalletModule } from "./wallet/wallet.module";
import { GiftsModule } from "./gifts/gifts.module";
import { GamesModule } from "./games/games.module";
import { HostAgenciesModule } from "./host-agencies/host-agencies.module";
import { AdminStatsModule } from "./admin-stats/admin-stats.module";
import { StoreModule } from "./store/store.module";
import { VipModule } from "./vip/vip.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { IpBanGuard } from "./common/guards/ip-ban.guard";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";
import { HostAgentWithdrawalsModule } from "./host-agent-withdrawals/host-agent-withdrawals.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || "info",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true, colorize: true } },
        redact: ["req.headers.authorization", "req.headers.cookie"],
        autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
      },
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("throttle.ttl", 60) * 1000,
            limit: config.get<number>("throttle.limit", 100),
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    NotificationsModule,
    RechargeAgencyModule,
    RoomsModule,
    MessagingModule,
    WalletModule,
    GiftsModule,
    GamesModule,
    HostAgenciesModule,
    AdminStatsModule,
    StoreModule,
    VipModule,
    AdminUsersModule,
    StorageModule,
    HealthModule,
    HostAgentWithdrawalsModule,
    LeaderboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: IpBanGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
