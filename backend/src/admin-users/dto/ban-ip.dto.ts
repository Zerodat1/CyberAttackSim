import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIP, IsOptional, IsString, MaxLength } from "class-validator";

export class BanIpDto {
  @ApiProperty()
  @IsIP()
  ipAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
