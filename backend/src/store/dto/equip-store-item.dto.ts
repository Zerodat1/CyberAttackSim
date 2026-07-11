import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { StoreItemCategory } from "@prisma/client";

export class EquipStoreItemDto {
  @ApiProperty({ enum: StoreItemCategory })
  @IsEnum(StoreItemCategory)
  category: StoreItemCategory;

  @ApiPropertyOptional({ description: "Owned store item id to equip; omit/null to unequip" })
  @IsOptional()
  @IsString()
  storeItemId?: string | null;
}
