import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { StoreItemCategory } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { StoreService } from "./store.service";
import { EquipStoreItemDto } from "./dto/equip-store-item.dto";

@ApiTags("store")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("store")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get("items")
  listCatalog(@CurrentUser() user: AuthenticatedUser, @Query("category") category?: StoreItemCategory) {
    return this.storeService.listCatalog(user.id, category);
  }

  @Get("me")
  myInventory(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.myInventory(user.id);
  }

  @Post("items/:id/purchase")
  purchase(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.storeService.purchase(user.id, id);
  }

  @Post("equip")
  equip(@CurrentUser() user: AuthenticatedUser, @Body() dto: EquipStoreItemDto) {
    return this.storeService.equip(user.id, dto);
  }
}
