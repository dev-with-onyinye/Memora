import { Module } from '@nestjs/common';
import { TermiiSmsAdapter } from './adapters/termii-sms.adapter';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { DeliveryDispatcherService } from './delivery-dispatcher.service';

@Module({
  providers: [TermiiSmsAdapter, WhatsAppAdapter, DeliveryDispatcherService],
  exports: [DeliveryDispatcherService],
})
export class DeliveryModule {}
