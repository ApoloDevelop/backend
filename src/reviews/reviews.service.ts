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
    let artist = await this.prisma.artist.findFirst({
      where: { name: artistName },
    });

    if (!artist) {
      const item = await this.prisma.item.create({
        data: {
          item_type: 'artist',
          item_id: 0,
        },
      });

      artist = await this.prisma.artist.create({
        data: {
          name: artistName,
          item_id: item.id,
          ...(birthdate && { birthdate }),
        },
      });

      await this.prisma.item.update({
        where: { id: item.id },
        data: { item_id: artist.id },
      });
    }

    return this.prisma.review.create({
      data: {
        user_id: userId,
        score,
        text: comment,
        item_id: artist.item_id,
      },
    });
  }

  // ...existing code...

  async getArtistReviewAverages(artistName: string) {
    const artist = await this.prisma.artist.findFirst({
      where: { name: artistName },
    });
    if (!artist) {
      return { verified: null, unverified: null };
    }

    const [verified, unverified] = await Promise.all([
      this.prisma.review.aggregate({
        where: {
          item_id: artist.item_id,
          verified: 1,
        },
        _avg: { score: true },
      }),
      this.prisma.review.aggregate({
        where: {
          item_id: artist.item_id,
          verified: 0,
        },
        _avg: { score: true },
      }),
    ]);

    return {
      verified: verified._avg.score,
      unverified: unverified._avg.score,
    };
  }
}
