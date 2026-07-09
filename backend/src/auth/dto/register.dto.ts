import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf } from "class-validator";

export class RegisterDto {
  @ApiPropertyOptional()
  @ValidateIf((o: RegisterDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: RegisterDto) => !o.email)
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: "phone must be a valid E.164 number" })
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: "username must be 3-20 characters, letters/numbers/underscore only",
  })
  username: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}
