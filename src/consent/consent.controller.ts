import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ConsentService } from './consent.service';
import { UpdateConsentDto } from './dto/update-consent.dto';

@ApiTags('consent')
@ApiBearerAuth()
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user consent settings' })
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.consentService.getForUser(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the current user consent settings' })
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateConsentDto) {
    return this.consentService.updateForUser(user.id, dto);
  }
}
