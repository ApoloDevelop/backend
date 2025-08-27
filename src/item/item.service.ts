import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ItemType = 'artist' | 'album' | 'track' | 'venue' | 'genre';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureItemByTypeAndName(
    type: ItemType,
    name: string,
    ctx?: { artistName?: string; location?: string; albumName?: string },
  ): Promise<{ itemId: number }> {
    return this.prisma.$transaction(async (tx) => {
      if (type === 'artist') {
        // Buscar existente
        let artist = await tx.artist.findFirst({ where: { name } });
        if (artist) return { itemId: artist.item_id };

        // Crear
        const item = await tx.item.create({
          data: { item_type: 'artist', item_id: 0 },
        });
        artist = await tx.artist.create({ data: { name, item_id: item.id } });
        await tx.item.update({
          where: { id: item.id },
          data: { item_id: artist.id },
        });
        return { itemId: artist.item_id };
      }

      if (type === 'album') {
        if (!ctx?.artistName)
          throw new BadRequestException('artistName es obligatorio para album');

        // Asegurar artista
        let artist = await tx.artist.findFirst({
          where: { name: ctx.artistName },
        });
        if (!artist) {
          const ai = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({
            data: { name: ctx.artistName, item_id: ai.id },
          });
          await tx.item.update({
            where: { id: ai.id },
            data: { item_id: artist.id },
          });
        }

        // Buscar álbum ya vinculado a ese artista
        let album = await tx.album.findFirst({
          where: { name, album_artist: { some: { id_artist: artist.id } } },
        });
        if (album) return { itemId: album.item_id };

        // Crear álbum + relación
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
        return { itemId: album.item_id };
      }

      if (type === 'track') {
        if (!ctx?.artistName)
          throw new BadRequestException('artistName es obligatorio para track');

        // Asegurar artista
        let artist = await tx.artist.findFirst({
          where: { name: ctx.artistName },
        });
        if (!artist) {
          const ai = await tx.item.create({
            data: { item_type: 'artist', item_id: 0 },
          });
          artist = await tx.artist.create({
            data: { name: ctx.artistName, item_id: ai.id },
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
          const it = await tx.item.create({
            data: { item_type: 'track', item_id: 0 },
          });
          track = await tx.track.create({
            data: { title: name, item_id: it.id },
          });
          await tx.item.update({
            where: { id: it.id },
            data: { item_id: track.id },
          });
          await tx.track_artist.create({
            data: { track_id: track.id, artist_id: artist.id },
          });
        }

        // 3) si viene albumName, asegurar álbum y crear relación track_album
        if (ctx.albumName && ctx.albumName.trim()) {
          // asegurar álbum asociado al artista
          let album = await tx.album.findFirst({
            where: {
              name: ctx.albumName,
              album_artist: { some: { id_artist: artist.id } },
            },
          });
          if (!album) {
            const ai = await tx.item.create({
              data: { item_type: 'album', item_id: 0 },
            });
            album = await tx.album.create({
              data: { name: ctx.albumName, item_id: ai.id },
            });
            await tx.item.update({
              where: { id: ai.id },
              data: { item_id: album.id },
            });
            await tx.album_artist.create({
              data: { id_album: album.id, id_artist: artist.id },
            });
          }

          // vincular track ↔ album si no existe
          const existsTA = await tx.track_album.findFirst({
            where: { track_id: track.id, album_id: album.id },
          });
          if (!existsTA) {
            await tx.track_album.create({
              data: { track_id: track.id, album_id: album.id },
            });
          }
        }

        return { itemId: track.item_id };
      }

      if (type === 'venue') {
        // Buscar por nombre (+ location si viene)
        let venue = await tx.venue.findFirst({
          where: { name, ...(ctx?.location ? { location: ctx.location } : {}) },
        });
        if (venue) return { itemId: venue.item_id };

        // Crear venue
        const item = await tx.item.create({
          data: { item_type: 'venue', item_id: 0 },
        });
        venue = await tx.venue.create({
          data: {
            name,
            location: ctx?.location ?? '',
            venue_type: 'other',
            item_id: item.id,
          },
        });
        await tx.item.update({
          where: { id: item.id },
          data: { item_id: venue.id },
        });
        return { itemId: venue.item_id };
      }

      if (type === 'genre') {
        let genre = await tx.genre.findFirst({ where: { NAME: name } });
        if (genre) return { itemId: genre.item_id };

        const item = await tx.item.create({
          data: { item_type: 'genre', item_id: 0 },
        });
        genre = await tx.genre.create({
          data: { NAME: name, item_id: item.id },
        });
        await tx.item.update({
          where: { id: item.id },
          data: { item_id: genre.id },
        });
        return { itemId: genre.item_id };
      }

      throw new BadRequestException(`Tipo de ítem no soportado: ${type}`);
    });
  }
}
