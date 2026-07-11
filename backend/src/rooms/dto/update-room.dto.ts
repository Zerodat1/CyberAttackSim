import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export const ALLOWED_SEAT_COUNTS = [4, 8, 10, 15, 20] as const;

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

  @ApiPropertyOptional({ enum: ALLOWED_SEAT_COUNTS, description: "Number of mic seats in the room" })
  @IsOptional()
  @IsIn(ALLOWED_SEAT_COUNTS)
  seatCount?: number;

  @ApiPropertyOptional({ description: "Background image URL for the room, or null to reset to the default" })
  @IsOptional()
  @IsString()
  backgroundUrl?: string | null;
}
