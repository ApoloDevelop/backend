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
      select: { id: true, name: true },
    });
  }
}
