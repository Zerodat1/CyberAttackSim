import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ForwardMessageDto {
  @ApiProperty()
  @IsString()
  targetConversationId: string;
}
