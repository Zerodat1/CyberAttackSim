import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum ApplicationReviewAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  SUSPEND = "SUSPEND",
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ApplicationReviewAction })
  @IsEnum(ApplicationReviewAction)
  action: ApplicationReviewAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
