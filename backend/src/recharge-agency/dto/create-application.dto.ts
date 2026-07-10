import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class SocialLinksDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  agencyName: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paymentMethods: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousExperience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: SocialLinksDto })
  @IsOptional()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiProperty({ description: "A base64 image data URI of the applicant's ID document" })
  @IsString()
  @MaxLength(3_000_000)
  @Matches(/^(https?:\/\/.+|data:image\/(png|jpe?g|webp);base64,.+)$/, {
    message: "idDocumentUrl must be a valid http(s) URL or a base64 image data URI",
  })
  idDocumentUrl: string;

  @ApiProperty({ description: "Must be true to submit the application" })
  @Equals(true)
  termsAccepted: boolean;
}
