import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async findItemByTypeAndName(
    type: string,
    name: string,
  ): Promise<{ itemId: number }> {
    let item;

    switch (type.toLowerCase()) {
      case 'artist':
        item = await this.prisma.artist.findFirst({
          where: { name },
          select: { item_id: true },
        });
        break;
      case 'album':
        item = await this.prisma.album.findFirst({
          where: { name },
          select: { item_id: true },
        });
        break;
      case 'track':
        item = await this.prisma.track.findFirst({
          where: { title: name },
          select: { item_id: true },
        });
        break;
      case 'venue':
        item = await this.prisma.venue.findFirst({
          where: { name },
          select: { item_id: true },
        });
        break;
      case 'genre':
        item = await this.prisma.genre.findFirst({
          where: { NAME: name },
          select: { item_id: true },
        });
        break;
      default:
        throw new BadRequestException(`Tipo de ítem no soportado: ${type}`);
    }

    if (!item) {
      throw new NotFoundException(
        `No se encontró un ítem del tipo "${type}" con el nombre "${name}"`,
      );
    }

    return { itemId: item.item_id };
  }
}
