import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryCampaignsDto) {
    return this.prisma.campaign.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }
    return campaign;
  }

  async findOne(userId: string, id: string) {
    return this.findOwnedOrThrow(userId, id);
  }

  async create(userId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCampaignDto) {
    await this.findOwnedOrThrow(userId, id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);
    return this.prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Activates a DRAFT/PAUSED campaign and schedules its next run. */
  async activate(userId: string, id: string) {
    const campaign = await this.findOwnedOrThrow(userId, id);
    const nextRunAt = campaign.startDate && campaign.startDate > new Date() ? campaign.startDate : new Date();
    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE, nextRunAt },
    });
  }
}
