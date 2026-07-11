import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class ChangeMemberRoleDto {
  @ApiProperty({ enum: ["CO_OWNER", "ADMIN", "MODERATOR", "MEMBER"] })
  @IsIn(["CO_OWNER", "ADMIN", "MODERATOR", "MEMBER"])
  role: "CO_OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
}
