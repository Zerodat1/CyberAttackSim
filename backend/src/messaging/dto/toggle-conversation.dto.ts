import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class TogglePinDto {
  @ApiProperty()
  @IsBoolean()
  pinned: boolean;
}

export class ToggleMuteDto {
  @ApiProperty()
  @IsBoolean()
  muted: boolean;
}
