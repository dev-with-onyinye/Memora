import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryLogsController } from './delivery-logs.controller';
import { DeliveryLogsService } from './delivery-logs.service';

@Module({
  imports: [DeliveryModule],
  controllers: [DeliveryLogsController],
  providers: [DeliveryLogsService],
  exports: [DeliveryLogsService],
})
export class DeliveryLogsModule {}
