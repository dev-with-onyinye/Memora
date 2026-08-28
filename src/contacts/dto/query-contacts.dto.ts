import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactModeTag } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryContactsDto {
  @ApiPropertyOptional({ enum: ContactModeTag })
  @IsOptional()
  @IsEnum(ContactModeTag)
  mode?: ContactModeTag;
}
