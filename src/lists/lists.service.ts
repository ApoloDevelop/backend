import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async getListsByUserId(userId: number, itemType?: string) {
    return this.prisma.custom_list.findMany({
      where: {
        userId,
        ...(itemType && { itemType: itemType as any }), // Cast to enum type; replace 'any' with the actual enum if available
      }, // Filtrar por itemType si se proporciona
      select: {
        id: true,
        name: true,
        createdAt: true,
        listItems: { select: { itemId: true } },
      },
    });
  }

  async createList({
    userId,
    name,
    itemType,
  }: {
    userId: number;
    name: string;
    itemType?: string;
  }) {
    return this.prisma.custom_list.create({
      data: {
        userId,
        name,
        itemType: itemType as any,
      },
      select: { id: true, name: true },
    });
  }

  async addItemToList({ listId, itemId }: { listId: number; itemId: number }) {
    return this.prisma.custom_list_item.create({
      data: {
        listId,
        itemId,
      },
    });
  }

  async removeItemFromList({
    listId,
    itemId,
  }: {
    listId: number;
    itemId: number;
  }) {
    return this.prisma.custom_list_item.deleteMany({
      where: {
        listId,
        itemId,
      },
    });
  }
}
