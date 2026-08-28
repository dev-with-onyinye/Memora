import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Channel, DeliveryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDeliveryLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiProperty({ enum: Channel })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiProperty({ example: 'Amina Yusuf' })
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @MinLength(1)
  recipientPhone!: string;

  @ApiProperty({ example: 'Happy birthday, Amina! Sent via Memora.' })
  @IsString()
  @MinLength(1)
  messageBody!: string;

  @ApiPropertyOptional({
    enum: DeliveryStatus,
    description: 'Optional initial status override. Defaults to the outcome of the (stubbed) send attempt.',
  })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;
}
