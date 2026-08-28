import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SYNC_RESOURCES, SyncResource, SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync-push.dto';

@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get(':resource')
  @ApiParam({ name: 'resource', enum: SYNC_RESOURCES })
  @ApiQuery({ name: 'since', required: false, description: 'ISO8601 watermark; omit for a full initial sync' })
  @ApiOperation({ summary: 'Pull server-side changes (including soft-deletes) since a given watermark' })
  pull(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: SyncResource,
    @Query('since') since?: string,
  ) {
    return this.syncService.pull(user.id, resource, since);
  }

  @Post(':resource')
  @ApiParam({ name: 'resource', enum: SYNC_RESOURCES })
  @ApiOperation({ summary: 'Push local changes; server applies last-write-wins conflict resolution' })
  push(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: SyncResource,
    @Body() dto: SyncPushDto,
  ) {
    return this.syncService.push(user.id, resource, dto.changes);
  }
}
