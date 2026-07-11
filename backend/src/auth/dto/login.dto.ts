import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class LoginDto {
  @ApiPropertyOptional()
  @ValidateIf((o: LoginDto) => !o.phone)
  @IsString()
  @MaxLength(255)
  identifier?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: LoginDto) => !o.identifier)
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ description: "TOTP code, required if 2FA is enabled" })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
