import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPasswordProtected?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateRoomDto) => o.isPasswordProtected === true)
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({ default: 8, minimum: 2, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  seatCount?: number;
}
