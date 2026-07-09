import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class CreateAdminInviteDto {
  @ApiPropertyOptional({ description: "Hours until the invite link expires; omit for no expiry" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  expiresInHours?: number;
}
