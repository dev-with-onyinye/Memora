import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DeliveryLogsService } from './delivery-logs.service';
import { CreateDeliveryLogDto } from './dto/create-delivery-log.dto';

@ApiTags('delivery-logs')
@ApiBearerAuth()
@Controller('delivery-logs')
export class DeliveryLogsController {
  constructor(private readonly deliveryLogsService: DeliveryLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List delivery logs for the current user' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryLogsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a delivery log entry (dispatches via the stubbed channel adapter)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDeliveryLogDto) {
    return this.deliveryLogsService.create(user.id, dto);
  }
}
