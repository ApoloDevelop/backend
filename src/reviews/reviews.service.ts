import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type RateableType = 'artist' | 'album' | 'track' | 'venue';

type RateArgs = {
  type: RateableType;
  name: string;
  userId: number;
  score: number;
  comment?: string;
  title?: string;
  artistName?: string; // para album/track
  location?: string; // para venue
};

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  private async resolveItemId({
    type,
    name,
    artistName,
    location,
  }: RateArgs): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      if (type === 'artist') {
        let artist = await tx.artist.findFirst({ where: { name } });
        if (!artist) {
          const item = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({ data: { name, item_id: item.id } });
          await tx.item.update({
            where: { id: item.id },
            data: { item_id: artist.id },
          });
        }
        return artist.item_id;
      }

      if (type === 'album') {
        if (!artistName) {
          throw new BadRequestException(
            'artistName es obligatorio para puntuar un álbum',
          );
        }
        // aseguro el artista
        let artist = await tx.artist.findFirst({ where: { name: artistName } });
        if (!artist) {
          const aItem = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({
            data: { name: artistName, item_id: aItem.id },
          });
          await tx.item.update({
            where: { id: aItem.id },
            data: { item_id: artist.id },
          });
        }
        // busco álbum por nombre + relación con ese artista
        let album = await tx.album.findFirst({
          where: { name, album_artist: { some: { id_artist: artist.id } } },
        });
        if (!album) {
          const item = await tx.item.create({
            data: { item_type: 'album', item_id: 0 },
          });
          album = await tx.album.create({ data: { name, item_id: item.id } });
          await tx.item.update({
            where: { id: item.id },
            data: { item_id: album.id },
          });
          await tx.album_artist.create({
            data: { id_album: album.id, id_artist: artist.id },
          });
        }
        return album.item_id;
      }

      //   if (type === 'track') {
      //     if (!artistName) {
      //       throw new BadRequestException(
      //         'artistName es obligatorio para puntuar una canción',
      //       );
      //     }
      //     let artist = await tx.artist.findFirst({ where: { name: artistName } });
      //     if (!artist) {
      //       const aItem = await tx.item.create({
      //         data: { item_type: 'artist', item_id: 0 },
      //       });
      //       artist = await tx.artist.create({
      //         data: { name: artistName, item_id: aItem.id },
      //       });
      //       await tx.item.update({
      //         where: { id: aItem.id },
      //         data: { item_id: artist.id },
      //       });
      //     }
      //     let track = await tx.track.findFirst({
      //       where: {
      //         title: name,
      //         track_artist: { some: { artist_id: artist.id } },
      //       },
      //     });
      //     if (!track) {
      //       const item = await tx.item.create({
      //         data: { item_type: 'track', item_id: 0 },
      //       });
      //       track = await tx.track.create({
      //         data: { title: name, item_id: item.id },
      //       });
      //       await tx.item.update({
      //         where: { id: item.id },
      //         data: { item_id: track.id },
      //       });
      //       await tx.track_artist.create({
      //         data: { track_id: track.id, artist_id: artist.id },
      //       });
      //     }
      //     return track.item_id;
      //   }

      //   // venue
      //   let venue = await tx.venue.findFirst({
      //     where: { name, ...(location ? { location } : {}) },
      //   });
      //   if (!venue) {
      //     const item = await tx.item.create({
      //       data: { item_type: 'venue', item_id: 0 },
      //     });
      //     venue = await tx.venue.create({
      //       data: {
      //         name,
      //         location: location ?? '',
      //         venue_type: 'other',
      //         item_id: item.id,
      //       },
      //     });
      //     await tx.item.update({
      //       where: { id: item.id },
      //       data: { item_id: venue.id },
      //     });
      //   }
      //   return venue.item_id;
    });
  }

  async rate(dto: RateArgs) {
    const itemId = await this.resolveItemId(dto);
    // Si añades @@unique([user_id, item_id]) en review, usa upsert
    return this.prisma.review.create({
      data: {
        user_id: dto.userId,
        item_id: itemId,
        score: dto.score,
        text: dto.comment,
        title: dto.title,
      },
    });
  }

  async getAlbumReviewStats(albumName: string, artistName?: string) {
    const album = await this.prisma.album.findFirst({
      where: {
        name: albumName,
        ...(artistName
          ? { album_artist: { some: { artist: { name: artistName } } } }
          : {}),
      },
      include: { item: true },
    });

    if (!album) {
      return {
        verified: null,
        unverified: null,
        verifiedCount: 0,
        unverifiedCount: 0,
        itemId: null,
      };
    }

    const [verifiedAvg, unverifiedAvg, verifiedCount, unverifiedCount] =
      await this.prisma.$transaction([
        this.prisma.review.aggregate({
          where: { item_id: album.item_id, verified: 1 },
          _avg: { score: true },
        }),
        this.prisma.review.aggregate({
          where: { item_id: album.item_id, verified: 0 },
          _avg: { score: true },
        }),
        this.prisma.review.count({
          where: { item_id: album.item_id, verified: 1 },
        }),
        this.prisma.review.count({
          where: { item_id: album.item_id, verified: 0 },
        }),
      ]);

    return {
      verified: verifiedAvg._avg.score,
      unverified: unverifiedAvg._avg.score,
      verifiedCount,
      unverifiedCount,
      itemId: album.item_id,
    };
  }

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

  async getArtistReviewCount(artistName: string) {
    const artist = await this.prisma.artist.findFirst({
      where: { name: artistName },
    });
    if (!artist) {
      return { verifiedCount: 0, unverifiedCount: 0 };
    }

    const [verifiedCount, unverifiedCount] = await Promise.all([
      this.prisma.review.count({
        where: {
          item_id: artist.item_id,
          verified: 1,
        },
      }),
      this.prisma.review.count({
        where: {
          item_id: artist.item_id,
          verified: 0,
        },
      }),
    ]);

    return {
      verifiedCount,
      unverifiedCount,
    };
  }

  async getReviewsByItem({
    itemId,
    verified,
  }: {
    itemId: number;
    verified: boolean;
  }) {
    return this.prisma.review.findMany({
      where: { item_id: itemId, verified: verified ? 1 : 0 },
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}
