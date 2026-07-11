import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Gender } from "@prisma/client";

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "An http(s) URL or a base64 image data URI" })
  @IsOptional()
  @IsString()
  @MaxLength(3_000_000)
  @Matches(/^(https?:\/\/.+|data:image\/(png|jpe?g|webp);base64,.+)$/, {
    message: "avatarUrl must be a valid http(s) URL or a base64 image data URI",
  })
  avatarUrl?: string;
}
