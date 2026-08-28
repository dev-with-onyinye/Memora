import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateCopyDto } from './dto/generate-copy.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-copy')
  @ApiOperation({
    summary: 'Generate campaign message copy',
    description:
      'Uses OpenAI ChatGPT when OPENAI_API_KEY is configured; otherwise (and on any failure) falls back ' +
      'to a canned template so this endpoint always returns usable copy.',
  })
  generateCopy(@Body() dto: GenerateCopyDto) {
    return this.aiService.generateCopy(dto);
  }
}
