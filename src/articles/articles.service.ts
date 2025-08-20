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

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

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
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }

  async create(dto: CreateArticleDto) {
    try {
      return await this.prisma.article.create({
        data: {
          title: dto.title,
          content: dto.content,
          author_id: dto.author_id,
          image_url: dto.image_url ?? null,
        },
      });
    } catch (e: any) {
      this.handlePrismaError(e, 'crear');
    }
  }

  async update(id: number, dto: UpdateArticleDto) {
    try {
      return await this.prisma.article.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.content !== undefined ? { content: dto.content } : {}),
          ...(dto.image_url !== undefined ? { image_url: dto.image_url } : {}),
        },
      });
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
