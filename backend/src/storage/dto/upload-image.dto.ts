import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches, MaxLength } from "class-validator";

const ALLOWED_PREFIXES = ["avatars", "id-documents", "room-covers", "withdrawal-proofs"] as const;
export type UploadPrefix = (typeof ALLOWED_PREFIXES)[number];

export class UploadImageDto {
  @ApiProperty({ description: "A base64 image data URI (png/jpeg/webp)" })
  @IsString()
  @MaxLength(8_000_000)
  @Matches(/^data:image\/(png|jpe?g|webp);base64,.+$/, {
    message: "dataUri must be a valid base64 image data URI",
  })
  dataUri: string;

  @ApiProperty({ enum: ALLOWED_PREFIXES })
  @IsIn(ALLOWED_PREFIXES)
  purpose: UploadPrefix;
}
