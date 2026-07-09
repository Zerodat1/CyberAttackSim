import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class MuteSeatDto {
  @ApiProperty()
  @IsBoolean()
  muted: boolean;
}

export class LockSeatDto {
  @ApiProperty()
  @IsBoolean()
  locked: boolean;
}
