import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { GiftsService } from "./gifts.service";
import { SendGiftDto } from "./dto/send-gift.dto";

@ApiTags("gifts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("gifts")
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Get()
  listCatalog() {
    return this.giftsService.listCatalog();
  }

  @Post("send")
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendGiftDto, @Req() req: Request) {
    return this.giftsService.sendGift(user.id, dto, { ipAddress: req.ip });
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser, @Query("direction") direction?: "sent" | "received") {
    return this.giftsService.listHistory(user.id, direction);
  }
}
