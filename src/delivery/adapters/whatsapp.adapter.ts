import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryChannelAdapter, DeliverySendResult } from './delivery-adapter.interface';

/**
 * Stub adapter for WhatsApp Business API delivery.
 * Does not make any live HTTP call in this MVP — see delivery-adapter.interface.ts for why.
 */
@Injectable()
export class WhatsAppAdapter implements DeliveryChannelAdapter {
  readonly channel = 'WHATSAPP';
  private readonly logger = new Logger(WhatsAppAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async send(recipientPhone: string, message: string): Promise<DeliverySendResult> {
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');

    if (!apiToken) {
      this.logger.log(`[stub] WHATSAPP_API_TOKEN not set — simulating WhatsApp send to ${recipientPhone}`);
      return {
        success: true,
        detail: 'Simulated send (no WHATSAPP_API_TOKEN configured): message logged, not actually delivered.',
      };
    }

    // Real integration point: POST to the WhatsApp Business Cloud API messages endpoint.
    // Intentionally left as a no-op canned response for the MVP.
    this.logger.log(`[stub] Would call WhatsApp Business API to send to ${recipientPhone}: "${message}"`);
    return {
      success: true,
      providerRef: `whatsapp-stub-${Date.now()}`,
      detail: 'Simulated send: WhatsApp Business API integration is stubbed for the MVP.',
    };
  }
}
