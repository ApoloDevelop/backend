import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async rateArtist({
    artistName,
    score,
    comment,
    userId,
    birthdate,
  }: {
    artistName: string;
    score: number;
    comment?: string;
    userId: number;
    birthdate?: Date;
  }) {
    // 1. Busca el artista por nombre
    let artist = await this.prisma.artist.findFirst({
      where: { name: artistName },
    });

    // 2. Si no existe, crea el item y luego el artista asociado
    if (!artist) {
      // Primero crea el item
      const item = await this.prisma.item.create({
        data: {
          item_type: 'artist',
          item_id: 0,
        },
      });

      // Luego crea el artista asociado al item
      artist = await this.prisma.artist.create({
        data: {
          name: artistName,
          item_id: item.id,
          ...(birthdate && { birthdate }), // Solo agrega birthdate si existe
        },
      });

      // Actualiza el item con el id real del artista
      await this.prisma.item.update({
        where: { id: item.id },
        data: { item_id: artist.id },
      });
    }

    // 3. Crea la review asociada al item del artista
    return this.prisma.review.create({
      data: {
        user_id: userId,
        score,
        text: comment,
        item_id: artist.item_id, // Relaciona con el item del artista
      },
    });
  }
}
