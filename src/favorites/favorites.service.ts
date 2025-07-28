import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemService } from 'src/item/item.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemService: ItemService,
  ) {}

  private async resolveOrCreateItemId(
    type: string,
    name: string,
  ): Promise<number> {
    try {
      const { itemId } = await this.itemService.findItemByTypeAndName(
        type,
        name,
      );
      return itemId;
    } catch (err) {
      // Si no existe, creamos el item y la entidad específica
      if (err instanceof NotFoundException) {
        // Crear registro genérico en item
        const item = await this.prisma.item.create({
          data: { item_type: type as any, item_id: 0 },
        });
        // Crear registro en tabla específica (solo para artist)
        if (type.toLowerCase() === 'artist') {
          const artist = await this.prisma.artist.create({
            data: { name, item_id: item.id },
          });
          // Actualizar el item con el id de la entidad específica
          await this.prisma.item.update({
            where: { id: item.id },
            data: { item_id: artist.id },
          });
        } else {
          // Para otros tipos, lanzar excepción o implementar lógica similar
          throw new NotFoundException(
            `Tipo de ítem no soportado para creación: ${type}`,
          );
        }
        return item.id;
      }
      throw err;
    }
  }

  /**
   * Comprueba si el usuario ha marcado al artista como favorito.
   */
  async isFavorite(userId: number, artistName: string): Promise<boolean> {
    const itemId = await this.resolveOrCreateItemId('artist', artistName);
    console.log(
      `Checking favorite for user ${userId} and artist ${artistName} with itemId ${itemId}`,
    );
    const fav = await this.prisma.favorite.findFirst({
      where: { user: userId, item_id: itemId },
    });
    return Boolean(fav);
  }

  /**
   * Añade un favorito.
   */
  async addFavorite(userId: number, artistName: string): Promise<void> {
    const itemId = await this.resolveOrCreateItemId('artist', artistName);
    await this.prisma.favorite.create({
      data: { user: userId, item_id: itemId },
    });
  }

  /**
   * Elimina un favorito. Usa deleteMany para evitar errores si hubiera duplicados.
   */
  async removeFavorite(userId: number, artistName: string): Promise<void> {
    const itemId = await this.resolveOrCreateItemId('artist', artistName);
    await this.prisma.favorite.deleteMany({
      where: { user: userId, item_id: itemId },
    });
  }
}
