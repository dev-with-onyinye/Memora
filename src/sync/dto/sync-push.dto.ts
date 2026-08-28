import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

/**
 * A single pushed change. Deliberately loosely typed beyond the sync envelope fields
 * (localId/updatedAt/id) — the remaining "...fields" vary per :resource (contacts vs
 * campaigns vs delivery-logs) and are whitelisted/validated inside SyncService against the
 * same rules as the equivalent create/update DTOs, rather than via a single static class.
 */
export interface SyncChangeItem {
  localId: string;
  id?: string;
  updatedAt: string;
  [key: string]: unknown;
}

export class SyncPushDto {
  @ApiProperty({
    description:
      'Array of changed local rows to push. Each item must include localId and updatedAt (ISO8601), ' +
      'plus the resource-specific fields (and "id" if this row was previously synced).',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  changes!: SyncChangeItem[];
}
