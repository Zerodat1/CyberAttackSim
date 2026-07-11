import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StorageService } from "./storage.service";
import { UploadImageDto } from "./dto/upload-image.dto";

@ApiTags("uploads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("uploads")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("image")
  async uploadImage(@Body() dto: UploadImageDto) {
    const url = await this.storageService.uploadImageFromDataUri(dto.dataUri, dto.purpose);
    return { url };
  }
}
