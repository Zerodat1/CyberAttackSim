import { PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { CreateStoreItemDto } from "./create-store-item.dto";

export class UpdateStoreItemDto extends PartialType(CreateStoreItemDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
