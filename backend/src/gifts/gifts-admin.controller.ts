import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GiftsService } from "./gifts.service";
import { CreateGiftDto } from "./dto/create-gift.dto";
import { UpdateGiftDto } from "./dto/update-gift.dto";

@ApiTags("gifts-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@Controller("gifts-admin")
export class GiftsAdminController {
  constructor(private readonly giftsService: GiftsService) {}

  @Get()
  list() {
    return this.giftsService.adminList();
  }

  @Post()
  create(@Body() dto: CreateGiftDto) {
    return this.giftsService.createGift(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGiftDto) {
    return this.giftsService.updateGift(id, dto);
  }
}
