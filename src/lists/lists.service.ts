import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async getListsByUserId(userId: number, itemType?: string) {
    return this.prisma.custom_list.findMany({
      where: {
        userId,
        ...(itemType && { itemType: itemType as any }),
      }, // Filtrar por itemType si se proporciona
      select: {
        id: true,
        name: true,
        createdAt: true,
        listItems: { select: { itemId: true } },
      },
    });
  }

  async createList({
    userId,
    name,
    itemType,
  }: {
    userId: number;
    name: string;
    itemType?: string;
  }) {
    return this.prisma.custom_list.create({
      data: {
        userId,
        name,
        itemType: itemType as any,
      },
      select: { id: true, name: true },
    });
  }

  async addItemToList({
    userId,
    listId,
    itemId,
  }: {
    userId: number;
    listId: number;
    itemId: number;
  }) {
    // Verifica que la lista es del usuario
    const owns = await this.prisma.custom_list.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
    if (!owns)
      throw new ForbiddenException(
        'No puedes modificar listas de otro usuario',
      );

    return this.prisma.custom_list_item.create({
      data: { listId, itemId },
    });
  }

  async removeItemFromList({
    userId,
    listId,
    itemId,
  }: {
    userId: number;
    listId: number;
    itemId: number;
  }) {
    const owns = await this.prisma.custom_list.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
    if (!owns)
      throw new ForbiddenException(
        'No puedes modificar listas de otro usuario',
      );

    await this.prisma.custom_list_item.deleteMany({
      where: { listId, itemId },
    });
  }

  async getListById(userId: number, listId: number) {
    const list = await this.prisma.custom_list.findFirst({
      where: { id: listId, userId },
      include: {
        listItems: {
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
                        album: {
                          include: {
                            album_artist: {
                              include: {
                                artist: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!list) {
      throw new ForbiddenException(
        'Lista no encontrada o no tienes acceso a ella',
      );
    }

    const processedList = {
      ...list,
      listItems: list.listItems.map((listItem) => {
        const item = listItem.item;
        let processedItem: any = { ...item };

        // Dependiendo del tipo de item, añadir el nombre desde la tabla correspondiente
        switch (item.item_type) {
          case 'artist':
            const artist = item.artist[0];
            if (artist) {
              processedItem.name = artist.name;
            }
            break;
          case 'album':
            const album = item.album[0];
            if (album) {
              processedItem.name = album.name;
              // Obtener el artista del álbum
              const albumArtist = album.album_artist?.[0]?.artist;
              if (albumArtist) {
                processedItem.artistName = albumArtist.name;
              }
            }
            break;
          case 'track':
            const track = item.track[0];
            if (track) {
              processedItem.name = track.title;
              // Obtener el artista de la canción
              const trackArtist = track.track_artist?.[0]?.artist;
              if (trackArtist) {
                processedItem.artistName = trackArtist.name;
              }
              // Obtener el álbum de la canción
              const trackAlbum = track.track_album?.[0]?.album;
              if (trackAlbum) {
                processedItem.albumName = trackAlbum.name;
              }
            }
            break;
        }

        return {
          ...listItem,
          item: processedItem,
        };
      }),
    };

    return processedList;
  }

  async deleteList(userId: number, listId: number) {
    const owns = await this.prisma.custom_list.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });

    if (!owns) {
      throw new ForbiddenException('No puedes eliminar listas de otro usuario');
    }

    // Primero eliminar todos los items de la lista
    await this.prisma.custom_list_item.deleteMany({
      where: { listId },
    });

    // Luego eliminar la lista
    await this.prisma.custom_list.delete({
      where: { id: listId },
    });
  }

  async updateListName(userId: number, listId: number, name: string) {
    const owns = await this.prisma.custom_list.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });

    if (!owns) {
      throw new ForbiddenException(
        'No puedes modificar listas de otro usuario',
      );
    }

    return this.prisma.custom_list.update({
      where: { id: listId },
      data: { name },
      select: { id: true, name: true },
    });
  }
}
