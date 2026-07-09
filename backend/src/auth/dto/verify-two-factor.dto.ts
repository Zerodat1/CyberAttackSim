import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class VerifyTwoFactorDto {
  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code: string;
}
