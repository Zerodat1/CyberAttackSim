import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { AgoraModule } from "../agora/agora.module";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { RoomsAdminController } from "./controllers/rooms-admin.controller";
import { RoomsGateway } from "./rooms.gateway";
import { RoomMemberGuard } from "./guards/room-member.guard";

@Module({
  imports: [NotificationsModule, AgoraModule, JwtModule.register({})],
  controllers: [RoomsController, RoomsAdminController],
  providers: [RoomsService, RoomsGateway, RoomMemberGuard],
})
export class RoomsModule {}
