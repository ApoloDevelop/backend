import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ItemService } from 'src/item/item.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

type RateableType = 'artist' | 'album' | 'track' | 'venue';

type RateArgs = {
  type: RateableType;
  name: string;
  userId: number;
  score: number;
  comment?: string;
  title?: string;
  artistName?: string;
  albumName?: string;
  location?: string;
};

type VoteValue = 1 | -1;

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private itemService: ItemService,
    private notificationsService: NotificationsService,
  ) {}

  async rate(dto: RateArgs, isVerifiedUser: boolean) {
    const { itemId } = await this.itemService.ensureItemByTypeAndName(
      dto.type,
      dto.name,
      {
        artistName: dto.artistName,
        albumName: dto.albumName,
        location: dto.location,
      },
    );

    return this.prisma.review.upsert({
      where: {
        user_id_item_id: {
          user_id: dto.userId,
          item_id: itemId,
        },
      },
      create: {
        user_id: dto.userId,
        item_id: itemId,
        score: dto.score,
        text: dto.comment,
        title: dto.title,
        verified: isVerifiedUser ? 1 : 0,
      },
      update: {
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

  async getTrackReviewStats(
    trackName: string,
    artistName?: string,
    albumName?: string,
  ) {
    if (!trackName?.trim()) {
      throw new BadRequestException('El nombre de la canción es obligatorio');
    }

    const track = await this.prisma.track.findFirst({
      where: {
        title: trackName,
        ...(artistName
          ? { track_artist: { some: { artist: { name: artistName } } } }
          : {}),
        ...(albumName
          ? { track_album: { some: { album: { name: albumName } } } }
          : {}),
      },
      include: { item: true },
    });

    if (!track) {
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
          where: { item_id: track.item_id, verified: 1 },
          _avg: { score: true },
        }),
        this.prisma.review.aggregate({
          where: { item_id: track.item_id, verified: 0 },
          _avg: { score: true },
        }),
        this.prisma.review.count({
          where: { item_id: track.item_id, verified: 1 },
        }),
        this.prisma.review.count({
          where: { item_id: track.item_id, verified: 0 },
        }),
      ]);

    return {
      verified: verifiedAvg._avg.score,
      unverified: unverifiedAvg._avg.score,
      verifiedCount,
      unverifiedCount,
      itemId: track.item_id,
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
    take = 10,
    cursor,
  }: {
    itemId: number;
    verified: boolean;
    userId?: number;
    take?: number;
    cursor?: number; // id de la última review recibida
  }) {
    // Página de reviews
    const reviews = await this.prisma.review.findMany({
      where: { item_id: itemId, verified: verified ? 1 : 0 },
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (!reviews.length) {
      return { items: [], nextCursor: null };
    }

    // Votos (solo de las ids de esta página)
    const ids = reviews.map((r) => r.id);

    const grouped = await this.prisma.review_vote.groupBy({
      by: ['review_id', 'value'] as const,
      where: { review_id: { in: ids } },
      _count: { _all: true },
    });

    const upMap = new Map<number, number>();
    const downMap = new Map<number, number>();
    for (const g of grouped) {
      if (g.value === 1) upMap.set(g.review_id, g._count._all);
      else if (g.value === -1) downMap.set(g.review_id, g._count._all);
    }

    const mine = userId
      ? await this.prisma.review_vote.findMany({
          where: { user_id: userId, review_id: { in: ids } },
          select: { review_id: true, value: true },
        })
      : [];
    const myMap = new Map<number, 1 | -1>();
    for (const m of mine) myMap.set(m.review_id, m.value as 1 | -1);

    const items = reviews.map((r) => ({
      id: r.id,
      score: r.score,
      title: r.title,
      text: r.text,
      created_at: r.created_at, // <- ya lo añadiste
      user: r.user,
      upvotes: upMap.get(r.id) ?? 0,
      downvotes: downMap.get(r.id) ?? 0,
      myVote: (myMap.get(r.id) ?? 0) as -1 | 0 | 1,
    }));

    const nextCursor =
      reviews.length === take ? reviews[reviews.length - 1].id : null;

    return { items, nextCursor };
  }

  async voteReview(reviewId: number, userId: number, value: VoteValue) {
    if (value !== 1 && value !== -1) {
      throw new BadRequestException('vote value must be 1 or -1');
    }

    // Obtener información de la review y su autor
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found');
    }

    // toggle: mismo valor -> borra; distinto -> actualiza; inexistente -> crea
    const existing = await this.prisma.review_vote.findUnique({
      where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
    });

    if (!existing) {
      await this.prisma.review_vote.create({
        data: { user_id: userId, review_id: reviewId, value },
      });

      // Generar notificación solo si es un upvote positivo y no es el autor votando su propia review
      if (value === 1 && review.user.id !== userId) {
        // Obtener información del votante
        const voter = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });

        if (voter) {
          await this.notificationsService.createReviewUpvoteNotification(
            review.user.id,
            reviewId,
            voter.username,
            review.title || 'tu review',
          );
        }
      }

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

    // Generar notificación si cambió a upvote positivo y no es el autor
    if (value === 1 && review.user.id !== userId) {
      const voter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (voter) {
        await this.notificationsService.createReviewUpvoteNotification(
          review.user.id,
          reviewId,
          voter.username,
          review.title || 'tu review',
        );
      }
    }

    return { ok: true, action: 'updated', value };
  }

  async getMyReviewForItem(itemId: number, userId: number) {
    if (!itemId || !userId) return null;

    return this.prisma.review.findUnique({
      where: {
        user_id_item_id: { user_id: userId, item_id: itemId }, // ⬅️ findUnique
      },
      select: { id: true, score: true, title: true, text: true },
    });
  }

  async removeByPolicy(
    reviewId: number,
    user: { id: number; role_id: number },
  ) {
    // Admin o Mod → borran cualquier reseña
    if (user.role_id === 1 || user.role_id === 2) {
      await this.prisma.review.delete({ where: { id: reviewId } });
      return { ok: true };
    }

    // Si no es admin/mod, solo puede borrar la suya
    const { count } = await this.prisma.review.deleteMany({
      where: { id: reviewId, user_id: user.id },
    });
    if (count === 0)
      throw new ForbiddenException('No puedes borrar esta reseña');
    return { ok: true };
  }
}
