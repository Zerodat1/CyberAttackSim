import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, ValidateIf } from "class-validator";

export class LoginDto {
  @ApiPropertyOptional()
  @ValidateIf((o: LoginDto) => !o.phone)
  @IsString()
  identifier?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: LoginDto) => !o.identifier)
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: "TOTP code, required if 2FA is enabled" })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
