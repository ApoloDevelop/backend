import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // Lista padres (paginados por cursor) + sus hijos
  async listForArticle(
    articleId: number,
    { limit = 10, cursor }: ListCommentsDto,
  ) {
    const take = Math.min(Math.max(limit, 1), 50);

    const parents = await this.prisma.comment.findMany({
      where: { article_id: articleId, parent_id: null },
      orderBy: { created_at: 'asc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
        other_comment: {
          orderBy: { created_at: 'asc' },
          include: {
            user: { select: { id: true, username: true, profile_pic: true } },
          },
        },
      },
    });

    const hasMore = parents.length > take;
    const data = hasMore ? parents.slice(0, take) : parents;
    const nextCursor = hasMore ? parents[parents.length - 1].id : null;

    const totalParents = await this.prisma.comment.count({
      where: { article_id: articleId, parent_id: null },
    });

    return { data, nextCursor, hasMore, totalParents, limit: take };
    // Nota: si quieres SSR inicial con total hijos, podemos calcularlo aparte.
  }

  // Crear comentario o respuesta
  async create(articleId: number, dto: CreateCommentDto) {
    if (dto.parent_id) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parent_id },
      });
      if (!parent || parent.article_id !== articleId) {
        throw new BadRequestException(
          'El comentario padre no existe o no corresponde a este artículo.',
        );
      }
    }

    return this.prisma.comment.create({
      data: {
        article_id: articleId,
        user_id: dto.user_id,
        parent_id: dto.parent_id ?? null,
        content: dto.content.trim(),
      },
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
      },
    });
  }

  // Borrar (hard delete). Si es padre, borra hijos primero.
  async hardDelete(commentId: number, userId: number) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { other_comment: { select: { id: true } } },
    });
    if (!existing) throw new NotFoundException('Comentario no encontrado.');
    if (existing.user_id !== userId)
      throw new ForbiddenException('No puedes borrar este comentario.');

    // Si tiene hijos, bórralos primero para evitar fallo de FK
    if (existing.other_comment.length > 0) {
      await this.prisma.comment.deleteMany({ where: { parent_id: commentId } });
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { id: commentId, deleted: true };
  }
}
