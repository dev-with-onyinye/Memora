import { ApiPropertyOptional } from '@nestjs/swagger';
import { Mode } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "Jane's Flower Shop" })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'NG', description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO country code, e.g. NG' })
  country?: string;

  @ApiPropertyOptional({ enum: Mode })
  @IsOptional()
  @IsEnum(Mode)
  currentMode?: Mode;
}
