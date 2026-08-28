import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryContactsDto) {
    return this.prisma.contact.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(query.mode ? { modeTags: { has: query.mode } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException('Contact not found');
    }
    if (contact.userId !== userId) {
      throw new ForbiddenException('You do not have access to this contact');
    }
    return contact;
  }

  async findOne(userId: string, id: string) {
    return this.findOwnedOrThrow(userId, id);
  }

  async create(userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: UpdateContactDto) {
    await this.findOwnedOrThrow(userId, id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);
    return this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
