import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemService } from '../item/item.service';

type FavType = 'artist' | 'album' | 'track' | 'venue';

type FavContext = {
  userId: number;
  type: FavType;
  name: string;
  artistName?: string;
  location?: string;
};

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemService: ItemService,
  ) {}

  // ===== Helpers =====

  /** SOLO BUSCA (no crea): devuelve itemId o null si no existe */
  private async findItemId(
    ctx: Omit<FavContext, 'userId'>,
  ): Promise<number | null> {
    const { type, name, artistName, location } = ctx;

    if (type === 'artist') {
      const artist = await this.prisma.artist.findFirst({ where: { name } });
      return artist ? artist.item_id : null;
    }

    if (type === 'album') {
      if (!artistName)
        throw new BadRequestException('artistName es obligatorio para album');
      const album = await this.prisma.album.findFirst({
        where: {
          name,
          album_artist: { some: { artist: { name: artistName } } },
        },
      });
      return album ? album.item_id : null;
    }

    if (type === 'track') {
      if (!artistName)
        throw new BadRequestException('artistName es obligatorio para track');
      const track = await this.prisma.track.findFirst({
        where: {
          title: name,
          track_artist: { some: { artist: { name: artistName } } },
        },
      });
      return track ? track.item_id : null;
    }

    // venue (QUE NO SE USA)
    const venue = await this.prisma.venue.findFirst({
      where: { name, ...(location ? { location } : {}) },
    });
    return venue ? venue.item_id : null;
  }

  private async resolveOrCreateItemId(
    ctx: Omit<FavContext, 'userId'>,
  ): Promise<number> {
    const { type, name, artistName, location } = ctx;

    const result = await this.itemService.ensureItemByTypeAndName(type, name, {
      artistName,
      location,
    });

    return result.itemId;
  }

  // ===== API =====

  async isFavorite(query: FavContext): Promise<boolean> {
    // NO crear si no existe
    const itemId = await this.findItemId({
      type: query.type,
      name: query.name,
      artistName: query.artistName,
      location: query.location,
    });
    if (!itemId) return false;

    const fav = await this.prisma.favorite.findFirst({
      where: { user: query.userId, item_id: itemId },
    });
    return !!fav;
  }

  async addFavorite(body: FavContext): Promise<void> {
    const itemId = await this.resolveOrCreateItemId({
      type: body.type,
      name: body.name,
      artistName: body.artistName,
      location: body.location,
    });

    await this.prisma.favorite.upsert({
      where: {
        uq_user_item: {
          user: body.userId,
          item_id: itemId,
        },
      },
      update: {},
      create: {
        user: body.userId,
        item_id: itemId,
      },
    });
  }

  async removeFavorite(query: FavContext): Promise<void> {
    const itemId = await this.findItemId({
      type: query.type,
      name: query.name,
      artistName: query.artistName,
      location: query.location,
    });
    if (!itemId) return; // nada que borrar
    await this.prisma.favorite.deleteMany({
      where: { user: query.userId, item_id: itemId },
    });
  }

  async getAllUserFavorites(userId: number): Promise<any[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { user: userId },
      include: {
        item: {
          include: {
            artist: true,
            album: {
              include: {
                album_artist: {
                  include: {
                    artist: true,
                  },
                },
              },
            },
            track: {
              include: {
                track_artist: {
                  include: {
                    artist: true,
                  },
                },
                track_album: {
                  include: {
                    album: true,
                  },
                },
              },
            },
            venue: true,
          },
        },
      },
      orderBy: {
        created_date: 'desc',
      },
    });

    return favorites.map((fav) => {
      const item = fav.item;
      const itemType = item.item_type;

      let name = '';
      let artistName = '';
      let albumName = '';

      switch (itemType) {
        case 'artist':
          name = item.artist?.[0]?.name || '';
          break;
        case 'album':
          name = item.album?.[0]?.name || '';
          artistName = item.album?.[0]?.album_artist?.[0]?.artist?.name || '';
          break;
        case 'track':
          name = item.track?.[0]?.title || '';
          artistName = item.track?.[0]?.track_artist?.[0]?.artist?.name || '';
          albumName = item.track?.[0]?.track_album?.[0]?.album?.name || '';
          break;
        case 'venue':
          name = item.venue?.[0]?.name || '';
          break;
      }

      return {
        itemId: fav.item_id,
        type: itemType,
        item: {
          id: fav.item_id,
          name,
          artistName,
          albumName,
        },
      };
    });
  }
}
