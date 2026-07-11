import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoomsService } from "../rooms.service";

@ApiTags("rooms-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.OWNER)
@Controller("rooms-admin")
export class RoomsAdminController {
  constructor(private readonly roomsService: RoomsService) {}

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.roomsService.deleteRoom(id, "OWNER");
  }
}
