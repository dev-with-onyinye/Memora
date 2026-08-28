import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignTone, CampaignType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class GenerateCopyDto {
  @ApiProperty({ enum: CampaignTone })
  @IsEnum(CampaignTone)
  tone!: CampaignTone;

  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  campaignType!: CampaignType;

  @ApiPropertyOptional({
    description: 'Free-form personalization context, e.g. { "contactName": "Amina", "businessName": "Amina Bakes" }',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  dynamicContext?: Record<string, unknown>;
}
