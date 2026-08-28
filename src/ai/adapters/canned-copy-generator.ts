import { Injectable } from '@nestjs/common';
import { CampaignTone, CampaignType } from '@prisma/client';
import { CopyGenerator } from './copy-generator.interface';
import { GenerateCopyDto } from '../dto/generate-copy.dto';

const TONE_PHRASES: Record<CampaignTone, string> = {
  [CampaignTone.PROMOTIONAL]: "Don't miss out",
  [CampaignTone.WARM_FRIENDLY]: 'Just thinking of you',
  [CampaignTone.URGENT_DISCOUNT]: "Hurry, this won't last",
  [CampaignTone.PROFESSIONAL]: 'A quick note from our team',
};

const CAMPAIGN_TYPE_BODY: Record<CampaignType, string> = {
  [CampaignType.AUTOMATED_RECURRING]: "here's a little something to celebrate you today.",
  [CampaignType.PROMOTIONAL]: 'we have a special offer we think you will love.',
  [CampaignType.ONE_TIME]: "we wanted to reach out with something just for you.",
  [CampaignType.MILESTONE]: "congratulations on this milestone — we're celebrating with you!",
};

/**
 * Canned, template-based copy generator. Used whenever OPENAI_API_KEY is not configured
 * (or the live OpenAI call fails), so /ai/generate-copy always returns something usable.
 */
@Injectable()
export class CannedCopyGenerator implements CopyGenerator {
  async generate(dto: GenerateCopyDto): Promise<string> {
    const name = (dto.dynamicContext?.contactName as string | undefined) ?? 'there';
    const business = (dto.dynamicContext?.businessName as string | undefined) ?? 'us';

    const opener = TONE_PHRASES[dto.tone];
    const body = CAMPAIGN_TYPE_BODY[dto.campaignType];

    return `${opener}, ${name}! ${body} — from ${business}. Sent via Memora.`;
  }
}
