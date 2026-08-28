import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registration always creates a ConsentSettings row for the new user, but this
   * getOrCreate keeps the endpoint robust for any account created before that existed.
   */
  async getForUser(userId: string) {
    const existing = await this.prisma.consentSettings.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }
    return this.prisma.consentSettings.create({ data: { userId } });
  }

  async updateForUser(userId: string, dto: UpdateConsentDto) {
    await this.getForUser(userId);
    return this.prisma.consentSettings.update({ where: { userId }, data: dto });
  }
}
