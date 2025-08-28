import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

type VoteValue = 1 | -1;

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
    userId,
  }: {
    itemId: number;
    verified: boolean;
    userId?: number;
  }) {
    const reviews = await this.prisma.review.findMany({
      where: { item_id: itemId, verified: verified ? 1 : 0 },
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
      },
      orderBy: { id: 'desc' },
    });

    if (!reviews.length) return [];

    const ids = reviews.map((r) => r.id);

    const grouped = await this.prisma.review_vote.groupBy({
      by: ['review_id', 'value'] as const,
      where: {
        review_id: { in: ids },
        // OJO: NO ponemos value aquí para que salga 1 y -1 en una sola query.
      } satisfies Prisma.review_voteWhereInput,
      _count: { _all: true },
    });

    const upMap = new Map<number, number>();
    const downMap = new Map<number, number>();
    for (const g of grouped) {
      if (g.value === 1) upMap.set(g.review_id, g._count._all);
      else if (g.value === -1) downMap.set(g.review_id, g._count._all);
    }

    // Mi voto (opcional)
    const myVotes = userId
      ? await this.prisma.review_vote.findMany({
          where: { user_id: userId, review_id: { in: ids } },
          select: { review_id: true, value: true },
        })
      : [];

    const mineMap = new Map<number, 1 | -1>();
    for (const v of myVotes) mineMap.set(v.review_id, v.value as 1 | -1);

    return reviews.map((r) => ({
      ...r,
      upvotes: upMap.get(r.id) ?? 0,
      downvotes: downMap.get(r.id) ?? 0,
      myVote: mineMap.get(r.id) ?? 0,
    }));
  }

  async voteReview(reviewId: number, userId: number, value: VoteValue) {
    if (value !== 1 && value !== -1) {
      throw new BadRequestException('vote value must be 1 or -1');
    }

    // toggle: mismo valor -> borra; distinto -> actualiza; inexistente -> crea
    const existing = await this.prisma.review_vote.findUnique({
      where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
    });

    if (!existing) {
      await this.prisma.review_vote.create({
        data: { user_id: userId, review_id: reviewId, value },
      });
      return { ok: true, action: 'created', value };
    }

    if (existing.value === value) {
      await this.prisma.review_vote.delete({
        where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
      });
      return { ok: true, action: 'removed' };
    }

    await this.prisma.review_vote.update({
      where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
      data: { value },
    });
    return { ok: true, action: 'updated', value };
  }
}
