import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceSegment, CampaignTone, CampaignType, ScheduleFrequency } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'August VIP Birthday Blast' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  type!: CampaignType;

  @ApiProperty({ enum: ScheduleFrequency })
  @IsEnum(ScheduleFrequency)
  scheduleFrequency!: ScheduleFrequency;

  @ApiProperty({ example: '09:00', description: 'Time of day in "HH:mm" 24h format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'scheduleTime must be in "HH:mm" 24h format' })
  scheduleTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: AudienceSegment })
  @IsEnum(AudienceSegment)
  audienceSegment!: AudienceSegment;

  @ApiProperty({ example: 'Happy birthday! Enjoy 15% off your next visit this week only.' })
  @IsString()
  @MinLength(1)
  messageBody!: string;

  @ApiPropertyOptional({ enum: CampaignTone })
  @IsOptional()
  @IsEnum(CampaignTone)
  tone?: CampaignTone;
}
