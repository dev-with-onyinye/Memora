import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryChannelAdapter, DeliverySendResult } from './delivery-adapter.interface';

/**
 * Stub adapter for SMS delivery via Termii (https://termii.com).
 * Does not make any live HTTP call in this MVP — see delivery-adapter.interface.ts for why.
 */
@Injectable()
export class TermiiSmsAdapter implements DeliveryChannelAdapter {
  readonly channel = 'SMS';
  private readonly logger = new Logger(TermiiSmsAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async send(recipientPhone: string, message: string): Promise<DeliverySendResult> {
    const apiKey = this.configService.get<string>('TERMII_API_KEY');

    if (!apiKey) {
      this.logger.log(`[stub] TERMII_API_KEY not set — simulating SMS send to ${recipientPhone}`);
      return {
        success: true,
        detail: 'Simulated send (no TERMII_API_KEY configured): message logged, not actually delivered.',
      };
    }

    // Real integration point: POST to Termii's /api/sms/send with apiKey, recipientPhone, message.
    // Intentionally left as a no-op canned response for the MVP.
    this.logger.log(`[stub] Would call Termii API to send SMS to ${recipientPhone}: "${message}"`);
    return {
      success: true,
      providerRef: `termii-stub-${Date.now()}`,
      detail: 'Simulated send: Termii integration is stubbed for the MVP.',
    };
  }
}
