import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class UpdateRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPasswordProtected?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((o: UpdateRoomDto) => o.isPasswordProtected === true)
  @IsString()
  @MinLength(4)
  password?: string;
}
