import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { DeliverySendResult } from './adapters/delivery-adapter.interface';
import { TermiiSmsAdapter } from './adapters/termii-sms.adapter';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';

@Injectable()
export class DeliveryDispatcherService {
  constructor(
    private readonly termiiSmsAdapter: TermiiSmsAdapter,
    private readonly whatsAppAdapter: WhatsAppAdapter,
  ) {}

  async send(channel: Channel, recipientPhone: string, message: string): Promise<DeliverySendResult> {
    const adapter = channel === Channel.SMS ? this.termiiSmsAdapter : this.whatsAppAdapter;
    return adapter.send(recipientPhone, message);
  }
}
