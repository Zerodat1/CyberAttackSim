import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminInvitesController } from "./admin-invites.controller";
import { AdminInvitesService } from "./admin-invites.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminInvitesController],
  providers: [AdminInvitesService],
})
export class AdminInvitesModule {}
