import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessSegment, ContactModeTag, ContactSource, OccasionType, Relationship } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MinLength,
  Min,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Amina Yusuf' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiPropertyOptional({ enum: Relationship })
  @IsOptional()
  @IsEnum(Relationship)
  relationship?: Relationship;

  @ApiProperty({ enum: ContactModeTag, isArray: true, example: [ContactModeTag.PERSONAL] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsEnum(ContactModeTag, { each: true })
  modeTags!: ContactModeTag[];

  @ApiProperty({ enum: OccasionType })
  @IsEnum(OccasionType)
  occasionType!: OccasionType;

  @ApiProperty({ minimum: 1, maximum: 12, example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  occasionMonth!: number;

  @ApiProperty({ minimum: 1, maximum: 31, example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  occasionDay!: number;

  @ApiPropertyOptional({ example: 1990 })
  @IsOptional()
  @IsInt()
  occasionYear?: number;

  @ApiPropertyOptional({ enum: BusinessSegment })
  @IsOptional()
  @IsEnum(BusinessSegment)
  businessSegment?: BusinessSegment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ enum: ContactSource, default: ContactSource.MANUAL })
  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;
}
