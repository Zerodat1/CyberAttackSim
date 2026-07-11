import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { MessagingService } from "./messaging.service";
import { MessagingController } from "./messaging.controller";
import { MessagingGateway } from "./messaging.gateway";

@Module({
  imports: [NotificationsModule, JwtModule.register({})],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
