import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { StoreService } from "./store.service";
import { CreateStoreItemDto } from "./dto/create-store-item.dto";
import { UpdateStoreItemDto } from "./dto/update-store-item.dto";

@ApiTags("store-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@Controller("store-admin")
export class StoreAdminController {
  constructor(private readonly storeService: StoreService) {}

  @Get("items")
  list() {
    return this.storeService.adminList();
  }

  @Post("items")
  create(@Body() dto: CreateStoreItemDto) {
    return this.storeService.createItem(dto);
  }

  @Patch("items/:id")
  update(@Param("id") id: string, @Body() dto: UpdateStoreItemDto) {
    return this.storeService.updateItem(id, dto);
  }
}
