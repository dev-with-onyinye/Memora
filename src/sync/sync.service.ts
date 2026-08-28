import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChangeItem } from './dto/sync-push.dto';

export type SyncResource = 'contacts' | 'campaigns' | 'delivery-logs';

export const SYNC_RESOURCES: SyncResource[] = ['contacts', 'campaigns', 'delivery-logs'];

interface SyncResult {
  localId: string;
  serverId: string;
  status: 'applied' | 'conflict';
  record: unknown;
}

interface ResourceConfig {
  // Prisma delegate for this resource. Typed loosely on purpose: findMany/findUnique/create/update
  // are shared across Contact/Campaign/DeliveryLog delegates but their concrete generated types
  // differ, and this module intentionally handles all three resources generically.
  delegate: {
    findMany: (args: unknown) => Promise<any[]>;
    findUnique: (args: unknown) => Promise<any | null>;
    create: (args: unknown) => Promise<any>;
    update: (args: unknown) => Promise<any>;
  };
  writableFields: string[];
  dateFields: string[];
  requiredFields: string[];
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  private getConfig(resource: SyncResource): ResourceConfig {
    switch (resource) {
      case 'contacts':
        return {
          delegate: this.prisma.contact,
          writableFields: [
            'name',
            'phone',
            'relationship',
            'modeTags',
            'occasionType',
            'occasionMonth',
            'occasionDay',
            'occasionYear',
            'businessSegment',
            'notes',
            'messageTemplate',
            'source',
            'deletedAt',
          ],
          dateFields: ['deletedAt'],
          requiredFields: ['name', 'phone', 'modeTags', 'occasionType', 'occasionMonth', 'occasionDay'],
        };
      case 'campaigns':
        return {
          delegate: this.prisma.campaign,
          writableFields: [
            'name',
            'type',
            'scheduleFrequency',
            'scheduleTime',
            'startDate',
            'endDate',
            'audienceSegment',
            'messageBody',
            'tone',
            'status',
            'nextRunAt',
            'deletedAt',
          ],
          dateFields: ['startDate', 'endDate', 'nextRunAt', 'deletedAt'],
          requiredFields: ['name', 'type', 'scheduleFrequency', 'scheduleTime', 'audienceSegment', 'messageBody'],
        };
      case 'delivery-logs':
        return {
          delegate: this.prisma.deliveryLog,
          writableFields: [
            'contactId',
            'campaignId',
            'channel',
            'recipientName',
            'recipientPhone',
            'messageBody',
            'status',
            'watermarked',
            'sentAt',
            'deletedAt',
          ],
          dateFields: ['sentAt', 'deletedAt'],
          requiredFields: ['channel', 'recipientName', 'recipientPhone', 'messageBody'],
        };
      default:
        throw new BadRequestException(
          `Unknown sync resource. Must be one of: ${SYNC_RESOURCES.join(', ')}`,
        );
    }
  }

  async pull(userId: string, resource: SyncResource, since?: string) {
    const config = this.getConfig(resource);
    const sinceDate = since ? new Date(since) : undefined;
    if (since && Number.isNaN(sinceDate?.getTime())) {
      throw new BadRequestException('Invalid "since" query parameter — must be an ISO8601 date string');
    }

    const data = await config.delegate.findMany({
      where: {
        userId,
        ...(sinceDate ? { updatedAt: { gt: sinceDate } } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });

    return { serverTime: new Date().toISOString(), data };
  }

  async push(userId: string, resource: SyncResource, changes: SyncChangeItem[]) {
    const config = this.getConfig(resource);
    const results: SyncResult[] = [];

    for (const change of changes) {
      results.push(await this.applyChange(userId, resource, config, change));
    }

    return { serverTime: new Date().toISOString(), results };
  }

  private async applyChange(
    userId: string,
    resource: SyncResource,
    config: ResourceConfig,
    change: SyncChangeItem,
  ): Promise<SyncResult> {
    if (!change || typeof change.localId !== 'string' || change.localId.length === 0) {
      throw new BadRequestException('Every change must include a string "localId"');
    }
    if (typeof change.updatedAt !== 'string' || Number.isNaN(new Date(change.updatedAt).getTime())) {
      throw new BadRequestException(`Change ${change.localId} must include a valid ISO8601 "updatedAt"`);
    }

    const incomingUpdatedAt = new Date(change.updatedAt);
    const data = this.sanitize(config, change);

    const serverId = typeof change.id === 'string' && change.id.length > 0 ? change.id : undefined;
    const existing = serverId ? await config.delegate.findUnique({ where: { id: serverId } }) : null;

    if (existing) {
      if (existing.userId !== userId) {
        throw new ForbiddenException(`Change ${change.localId} refers to a record you do not own`);
      }

      if (incomingUpdatedAt.getTime() < new Date(existing.updatedAt).getTime()) {
        // Server record is newer — last-write-wins means the server copy stays authoritative.
        return { localId: change.localId, serverId: existing.id, status: 'conflict', record: existing };
      }

      this.applyActivationSideEffect(resource, existing, data);

      const updated = await config.delegate.update({ where: { id: existing.id }, data });
      return { localId: change.localId, serverId: updated.id, status: 'applied', record: updated };
    }

    this.applyActivationSideEffect(resource, null, data);

    for (const field of config.requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new BadRequestException(`Change ${change.localId} is missing required field "${field}"`);
      }
    }

    const created = await config.delegate.create({
      data: { ...data, id: serverId ?? randomUUID(), userId },
    });
    return { localId: change.localId, serverId: created.id, status: 'applied', record: created };
  }

  /**
   * Mirrors CampaignsService.activate(): if a sync push transitions a campaign to ACTIVE
   * without an explicit nextRunAt, compute one server-side the same way the dedicated
   * POST /campaigns/:id/activate endpoint does. The mobile client activates campaigns purely
   * through /sync/campaigns, so this keeps that path from silently skipping the scheduling step.
   */
  private applyActivationSideEffect(resource: SyncResource, existing: any, data: Record<string, unknown>): void {
    // The mobile client always sends "nextRunAt" explicitly (null when it has none set locally),
    // so treat both undefined and null as "not provided" here — only an explicit non-null value
    // from the client should override the server-computed schedule.
    if (resource !== 'campaigns' || data.status !== CampaignStatus.ACTIVE || data.nextRunAt != null) {
      return;
    }
    const startDate = (data.startDate as Date | null | undefined) ?? existing?.startDate ?? null;
    data.nextRunAt = startDate && startDate > new Date() ? startDate : new Date();
  }

  /** Whitelists known writable fields for the resource and coerces date-like fields to Date. */
  private sanitize(config: ResourceConfig, change: SyncChangeItem): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of config.writableFields) {
      if (change[field] === undefined) {
        continue;
      }
      const value = change[field];
      if (config.dateFields.includes(field)) {
        data[field] = value === null ? null : new Date(value as string);
      } else {
        data[field] = value;
      }
    }
    return data;
  }
}
