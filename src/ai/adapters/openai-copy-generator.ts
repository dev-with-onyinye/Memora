import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopyGenerator } from './copy-generator.interface';
import { CannedCopyGenerator } from './canned-copy-generator';
import { GenerateCopyDto } from '../dto/generate-copy.dto';

/**
 * OpenAI ChatGPT-backed copy generator, with an automatic fallback to the canned template
 * generator whenever OPENAI_API_KEY is not configured, or the live call fails for any reason
 * (network error, rate limit, bad response shape, etc). This guarantees /ai/generate-copy
 * always returns a usable result without requiring a real API key for MVP development.
 */
@Injectable()
export class OpenAiCopyGenerator implements CopyGenerator {
  private readonly logger = new Logger(OpenAiCopyGenerator.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cannedCopyGenerator: CannedCopyGenerator,
  ) {}

  async generate(dto: GenerateCopyDto): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return this.cannedCopyGenerator.generate(dto);
    }

    try {
      const prompt = this.buildPrompt(dto);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const copy = json.choices?.[0]?.message?.content?.trim();
      if (!copy) {
        throw new Error('OpenAI API returned no usable content');
      }
      return copy;
    } catch (error) {
      this.logger.warn(
        `OpenAI copy generation failed, falling back to canned template: ${(error as Error).message}`,
      );
      return this.cannedCopyGenerator.generate(dto);
    }
  }

  private buildPrompt(dto: GenerateCopyDto): string {
    return (
      `Write a short SMS/WhatsApp marketing message for a small business customer engagement app. ` +
      `Tone: ${dto.tone}. Campaign type: ${dto.campaignType}. ` +
      `Context: ${JSON.stringify(dto.dynamicContext ?? {})}. ` +
      `Keep it under 300 characters and end with "Sent via Memora."`
    );
  }
}
