import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "password must contain at least one letter and one number",
  })
  password: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  fullName: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: "username must be 3-20 characters, letters/numbers/underscore only",
  })
  username: string;
}
