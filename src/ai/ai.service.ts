import { Injectable } from '@nestjs/common';
import { OpenAiCopyGenerator } from './adapters/openai-copy-generator';
import { GenerateCopyDto } from './dto/generate-copy.dto';

@Injectable()
export class AiService {
  constructor(private readonly copyGenerator: OpenAiCopyGenerator) {}

  async generateCopy(dto: GenerateCopyDto): Promise<{ copy: string }> {
    const copy = await this.copyGenerator.generate(dto);
    return { copy };
  }
}
