import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CannedCopyGenerator } from './adapters/canned-copy-generator';
import { OpenAiCopyGenerator } from './adapters/openai-copy-generator';

@Module({
  controllers: [AiController],
  providers: [AiService, CannedCopyGenerator, OpenAiCopyGenerator],
})
export class AiModule {}
