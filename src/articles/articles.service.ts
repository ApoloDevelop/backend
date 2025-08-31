// src/articles/articles.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ListArticlesDto } from './dto/list-articles.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { sanitizeQuill } from 'src/common/sanitize/sanitize.util';
import { ItemService } from 'src/item/item.service';

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private itemService: ItemService,
  ) {}

  async list(query: ListArticlesDto) {
    const safeOffset = Math.max(
      0,
      Number.isFinite(query.offset!) ? query.offset! : 0,
    );
    const safeLimit = Math.min(
      100,
      Math.max(1, Number.isFinite(query.limit!) ? query.limit! : 10),
    );

    const [total, data] = await this.prisma.$transaction([
      this.prisma.article.count(),
      this.prisma.article.findMany({
        skip: safeOffset,
        take: safeLimit,
        orderBy: { published_date: 'desc' },
        // Si más adelante quieres traer el autor o tags:
        // include: { user: { select: { id: true, username: true } }, article_tag: true },
      }),
    ]);

    return {
      data,
      total,
      offset: safeOffset,
      limit: safeLimit,
      hasMore: safeOffset + data.length < total,
    };
  }

  async getById(id: number) {
    const art = await this.prisma.article.findUnique({
      where: { id },
      include: {
        article_tag: {
          include: {
            tag: {
              include: {
                item: {
                  include: {
                    artist: true,
                    album: {
                      include: { album_artist: { include: { artist: true } } },
                    },
                    track: {
                      include: {
                        track_artist: { include: { artist: true } },
                        track_album: {
                          include: {
                            album: {
                              include: {
                                album_artist: { include: { artist: true } },
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
    if (!art) throw new NotFoundException('Artículo no encontrado');

    const tags = (art.article_tag ?? []).map((at) => {
      const it = at.tag.item;
      const type = it.item_type as 'artist' | 'album' | 'track';
      let artistName: string | undefined;
      let albumName: string | undefined;

      if (type === 'artist') {
        // Para comodidad, puedes exponer artistName = name
        artistName = at.tag.name;
      } else if (type === 'album') {
        const album = it.album?.[0];
        albumName = album?.name ?? at.tag.name; // nombre del tag ya es el álbum
        artistName = album?.album_artist?.[0]?.artist?.name;
      } else if (type === 'track') {
        const tr = it.track?.[0];
        artistName = tr?.track_artist?.[0]?.artist?.name;
        albumName = tr?.track_album?.[0]?.album?.name;
      }

      return {
        id: at.tag.id,
        name: at.tag.name,
        type:
          type === 'artist' || type === 'album' || type === 'track'
            ? type
            : 'artist',
        ...(artistName ? { artistName } : {}),
        ...(albumName ? { albumName } : {}),
      };
    });

    const { article_tag, ...rest } = art as any;
    return { ...rest, tags };
  }

  async create(dto: CreateArticleDto) {
    try {
      const clean = await sanitizeQuill(dto.content || '');
      console.log('Sanitized content:', clean);
      this.assertNotEmpty(clean, 'content');
      return await this.prisma.$transaction(async (tx) => {
        // 1) crear artículo
        const article = await tx.article.create({
          data: {
            title: dto.title,
            content: clean,
            author_id: dto.author_id,
            image_url: dto.image_url ?? null,
          },
        });

        // 2) si vienen tags: asegurar item + crear/usar tag + vincular
        if (dto.tags?.length) {
          for (const t of dto.tags) {
            // Asegurar itemId según tipo
            const ctx =
              t.type === 'artist'
                ? {}
                : t.type === 'album'
                  ? { artistName: t.artistName ?? '' }
                  : /* track */ {
                      artistName: t.artistName ?? '',
                      albumName: t.albumName ?? '',
                    };

            const { itemId } = await this.itemService.ensureItemByTypeAndName(
              t.type as any,
              t.name,
              ctx as any,
            );

            // Buscar/crear tag para ese item
            let tag = await tx.tag.findFirst({
              where: { name: t.name, item_id: itemId },
              select: { id: true },
            });
            if (!tag) {
              tag = await tx.tag.create({
                data: { name: t.name, item_id: itemId },
                select: { id: true },
              });
            }

            // Vincular (evita duplicado)
            const exists = await tx.article_tag.findFirst({
              where: { article_id: article.id, tag_id: tag.id },
              select: { article_id: true },
            });
            if (!exists) {
              await tx.article_tag.create({
                data: { article_id: article.id, tag_id: tag.id },
              });
            }
          }
        }

        return article;
      });
    } catch (e: any) {
      this.handlePrismaError(e, 'crear');
    }
  }

  async update(id: number, dto: UpdateArticleDto) {
    try {
      const clean =
        dto.content !== undefined
          ? await sanitizeQuill(dto.content || '')
          : undefined;
      if (clean !== undefined) this.assertNotEmpty(clean, 'content');

      // Hacemos todo en transacción
      await this.prisma.$transaction(async (tx) => {
        // 1) Actualizar campos básicos
        await tx.article.update({
          where: { id },
          data: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(clean !== undefined ? { content: clean } : {}),
            ...(dto.image_url !== undefined
              ? { image_url: dto.image_url }
              : {}),
          },
        });

        // 2) Si vienen tags, sincronizamos relaciones (set-like)
        if (dto.tags !== undefined) {
          // Resolver/asegurar tag_ids deseados
          const desiredTagIds: number[] = [];
          for (const t of dto.tags) {
            const ctx =
              t.type === 'artist'
                ? {}
                : t.type === 'album'
                  ? { artistName: t.artistName ?? '' }
                  : {
                      artistName: t.artistName ?? '',
                      albumName: t.albumName ?? '',
                    };

            const { itemId } = await this.itemService.ensureItemByTypeAndName(
              t.type as any,
              t.name,
              ctx as any,
            );

            // Buscar/crear tag para ese item + nombre
            let tag = await tx.tag.findFirst({
              where: { name: t.name, item_id: itemId },
              select: { id: true },
            });
            if (!tag) {
              tag = await tx.tag.create({
                data: { name: t.name, item_id: itemId },
                select: { id: true },
              });
            }
            desiredTagIds.push(tag.id);
          }

          // Estado actual
          const current = await tx.article_tag.findMany({
            where: { article_id: id },
            select: { tag_id: true },
          });
          const currentIds = new Set(current.map((x) => x.tag_id));
          const desiredIds = new Set(desiredTagIds);

          // calcular diferencias
          const toDelete = [...currentIds].filter((x) => !desiredIds.has(x));
          const toCreate = [...desiredIds].filter((x) => !currentIds.has(x));

          if (toDelete.length) {
            await tx.article_tag.deleteMany({
              where: { article_id: id, tag_id: { in: toDelete } },
            });
          }
          for (const tagId of toCreate) {
            await tx.article_tag.create({
              data: { article_id: id, tag_id: tagId },
            });
          }
        }
      });

      // Devolvemos el artículo completo (con tags)
      return this.getById(id);
    } catch (e: any) {
      this.handlePrismaError(e, 'actualizar', id);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.article.delete({ where: { id } });
      return { ok: true };
    } catch (e: any) {
      this.handlePrismaError(e, 'borrar', id);
    }
  }

  private assertNotEmpty(html: string, field: string) {
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    if (!text)
      throw new BadRequestException(`El ${field} no puede estar vacío`);
  }

  async related(id: number, limit = 3) {
    // tags del artículo
    const tIds = await this.prisma.article_tag.findMany({
      where: { article_id: id },
      select: { tag_id: true },
    });
    if (tIds.length === 0) return [];

    const ids = tIds.map((t) => t.tag_id);

    const related = await this.prisma.article.findMany({
      where: {
        id: { not: id },
        article_tag: { some: { tag_id: { in: ids } } },
      },
      orderBy: { published_date: 'desc' },
      take: Math.max(1, Math.min(50, limit)),
    });

    return related;
  }

  async updateOwned(id: number, dto: UpdateArticleDto, userId: number) {
    const clean =
      dto.content !== undefined
        ? await sanitizeQuill(dto.content || '')
        : undefined;
    if (clean !== undefined) this.assertNotEmpty(clean, 'content');

    const ok = await this.prisma.$transaction(async (tx) => {
      // 1) actualizar si es del usuario
      const { count } = await tx.article.updateMany({
        where: { id, author_id: userId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(clean !== undefined ? { content: clean } : {}),
          ...(dto.image_url !== undefined ? { image_url: dto.image_url } : {}),
        },
      });
      if (count === 0) return false;

      // 2) sincronizar tags si se envían
      if (dto.tags !== undefined) {
        const desiredTagIds: number[] = [];
        for (const t of dto.tags) {
          const ctx =
            t.type === 'artist'
              ? {}
              : t.type === 'album'
                ? { artistName: t.artistName ?? '' }
                : {
                    artistName: t.artistName ?? '',
                    albumName: t.albumName ?? '',
                  };

          const { itemId } = await this.itemService.ensureItemByTypeAndName(
            t.type as any,
            t.name,
            ctx as any,
          );

          let tag = await tx.tag.findFirst({
            where: { name: t.name, item_id: itemId },
            select: { id: true },
          });
          if (!tag) {
            tag = await tx.tag.create({
              data: { name: t.name, item_id: itemId },
              select: { id: true },
            });
          }
          desiredTagIds.push(tag.id);
        }

        const current = await tx.article_tag.findMany({
          where: { article_id: id },
          select: { tag_id: true },
        });
        const currentIds = new Set(current.map((x) => x.tag_id));
        const desiredIds = new Set(desiredTagIds);

        const toDelete = [...currentIds].filter((x) => !desiredIds.has(x));
        const toCreate = [...desiredIds].filter((x) => !currentIds.has(x));

        if (toDelete.length) {
          await tx.article_tag.deleteMany({
            where: { article_id: id, tag_id: { in: toDelete } },
          });
        }
        for (const tagId of toCreate) {
          await tx.article_tag.create({
            data: { article_id: id, tag_id: tagId },
          });
        }
      }

      return true;
    });

    return ok;
  }

  async removeOwned(id: number, userId: number) {
    const { count } = await this.prisma.article.deleteMany({
      where: { id, author_id: userId },
    });
    return count > 0;
  }

  private handlePrismaError(e: any, action: string, id?: number): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: registro no encontrado (update/delete)
      if (e.code === 'P2025') {
        throw new NotFoundException(
          `No se pudo ${action} el artículo${id ? ` con id ${id}` : ''}: no existe`,
        );
      }
      // FK violation u otros errores de integridad
      if (e.code === 'P2003') {
        throw new BadRequestException(
          'Violación de clave foránea (¿author_id existe?).',
        );
      }
    }
    throw new BadRequestException(`Error al ${action} el artículo`);
  }
}
