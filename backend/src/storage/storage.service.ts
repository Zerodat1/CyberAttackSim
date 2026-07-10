import { randomUUID } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const DATA_URI_PATTERN = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly publicBaseUrl: string | undefined;
  private readonly localUploadsDir: string;
  private readonly localPublicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>("storage.endpoint");
    const accessKeyId = this.config.get<string>("storage.accessKeyId");
    const secretAccessKey = this.config.get<string>("storage.secretAccessKey");
    this.bucket = this.config.get<string>("storage.bucket");
    this.publicBaseUrl = this.config.get<string>("storage.publicBaseUrl");

    this.s3Client =
      endpoint && accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({
            region: this.config.get<string>("storage.region", "auto"),
            endpoint,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;

    if (!this.s3Client) {
      this.logger.warn(
        "Object storage (R2/S3) is not configured — falling back to local disk storage under /uploads. " +
          "Set STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY for production.",
      );
    }

    this.localUploadsDir = join(process.cwd(), "uploads");
    this.localPublicBaseUrl = this.config.get<string>("PUBLIC_API_URL", "http://localhost:3000") + "/uploads";
    if (!existsSync(this.localUploadsDir)) {
      mkdirSync(this.localUploadsDir, { recursive: true });
    }
  }

  /**
   * Accepts a base64 image data URI, uploads it to R2/S3 (or local disk in dev
   * when object storage isn't configured), and returns a public URL. Nothing
   * is ever persisted as base64 in the database — only this returned URL is.
   */
  async uploadImageFromDataUri(dataUri: string, keyPrefix: string): Promise<string> {
    const match = DATA_URI_PATTERN.exec(dataUri);
    if (!match) {
      throw new BadRequestException("Expected a base64 image data URI (png/jpeg/webp)");
    }
    const [, mimeType, base64Body] = match;
    const buffer = Buffer.from(base64Body, "base64");
    const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
    const key = `${keyPrefix}/${randomUUID()}.${extension}`;

    if (this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      return `${this.publicBaseUrl}/${key}`;
    }

    const filePath = join(this.localUploadsDir, key.replace(/\//g, "_"));
    writeFileSync(filePath, buffer);
    return `${this.localPublicBaseUrl}/${key.replace(/\//g, "_")}`;
  }
}
