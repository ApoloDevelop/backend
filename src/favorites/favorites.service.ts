// favorites/favorites.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  // ===== Helpers de resolución =====

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

    // venue
    const venue = await this.prisma.venue.findFirst({
      where: { name, ...(location ? { location } : {}) },
    });
    return venue ? venue.item_id : null;
  }

  /** CREA si no existe (y relaciona con artist cuando aplique) */
  private async resolveOrCreateItemId(
    ctx: Omit<FavContext, 'userId'>,
  ): Promise<number> {
    const { type, name, artistName, location } = ctx;

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
        if (!artistName)
          throw new BadRequestException('artistName es obligatorio para album');

        let artist = await tx.artist.findFirst({ where: { name: artistName } });
        if (!artist) {
          const ai = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({
            data: { name: artistName, item_id: ai.id },
          });
          await tx.item.update({
            where: { id: ai.id },
            data: { item_id: artist.id },
          });
        }

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

      if (type === 'track') {
        if (!artistName)
          throw new BadRequestException('artistName es obligatorio para track');

        let artist = await tx.artist.findFirst({ where: { name: artistName } });
        if (!artist) {
          const ai = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({
            data: { name: artistName, item_id: ai.id },
          });
          await tx.item.update({
            where: { id: ai.id },
            data: { item_id: artist.id },
          });
        }

        let track = await tx.track.findFirst({
          where: {
            title: name,
            track_artist: { some: { artist_id: artist.id } },
          },
        });
        if (!track) {
          const item = await tx.item.create({
            data: { item_type: 'track', item_id: 0 },
          });
          track = await tx.track.create({
            data: { title: name, item_id: item.id },
          });
          await tx.item.update({
            where: { id: item.id },
            data: { item_id: track.id },
          });
          await tx.track_artist.create({
            data: { track_id: track.id, artist_id: artist.id },
          });
        }
        return track.item_id;
      }

      // venue
      let venue = await tx.venue.findFirst({
        where: { name, ...(location ? { location } : {}) },
      });
      if (!venue) {
        const item = await tx.item.create({
          data: { item_type: 'venue', item_id: 0 },
        });
        venue = await tx.venue.create({
          data: {
            name,
            location: location ?? '',
            venue_type: 'other',
            item_id: item.id,
          },
        });
        await tx.item.update({
          where: { id: item.id },
          data: { item_id: venue.id },
        });
      }
      return venue.item_id;
    });
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

    // Si pones índice único (recomendado), cambia a upsert
    const exists = await this.prisma.favorite.findFirst({
      where: { user: body.userId, item_id: itemId },
      select: { id: true },
    });
    if (!exists) {
      await this.prisma.favorite.create({
        data: { user: body.userId, item_id: itemId },
      });
    }
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
}
