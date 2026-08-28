import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryDispatcherService } from '../delivery/delivery-dispatcher.service';
import { CreateDeliveryLogDto } from './dto/create-delivery-log.dto';

@Injectable()
export class DeliveryLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: DeliveryDispatcherService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.deliveryLog.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateDeliveryLogDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // "Sent via Memora" watermark: free/trial tier gets watermarked messages, paid tier does not.
    const watermarked = user.subscriptionTier !== SubscriptionTier.PAID;

    const result = await this.dispatcher.send(dto.channel, dto.recipientPhone, dto.messageBody);

    return this.prisma.deliveryLog.create({
      data: {
        userId,
        contactId: dto.contactId,
        campaignId: dto.campaignId,
        channel: dto.channel,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        messageBody: dto.messageBody,
        watermarked,
        status: dto.status ?? (result.success ? 'SENT' : 'FAILED'),
        sentAt: result.success ? new Date() : null,
      },
    });
  }
}
