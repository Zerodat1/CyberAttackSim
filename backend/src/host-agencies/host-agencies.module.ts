import { Module } from "@nestjs/common";
import { HostAgenciesService } from "./host-agencies.service";
import { HostAgenciesController } from "./host-agencies.controller";

@Module({
  controllers: [HostAgenciesController],
  providers: [HostAgenciesService],
})
export class HostAgenciesModule {}
