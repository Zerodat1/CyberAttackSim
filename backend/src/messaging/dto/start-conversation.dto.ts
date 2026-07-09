import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class StartConversationDto {
  @ApiProperty()
  @IsString()
  targetUserId: string;
}
