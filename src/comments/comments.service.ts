import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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
  }

  // Crear comentario o respuesta
  async create(articleId: number, dto: CreateCommentDto) {
    if (dto.parent_id) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parent_id },
        include: {
          user: { select: { id: true, username: true } },
          article: { select: { title: true } },
        },
      });

      if (!parent || parent.article_id !== articleId) {
        throw new BadRequestException(
          'El comentario padre no existe o no corresponde a este artículo.',
        );
      }

      // Crear el comentario de respuesta
      const newComment = await this.prisma.comment.create({
        data: {
          article_id: articleId,
          user_id: dto.user_id,
          parent_id: dto.parent_id,
          content: dto.content.trim(),
        },
        include: {
          user: { select: { id: true, username: true, profile_pic: true } },
        },
      });

      // Solo generar notificación si no es el mismo usuario respondiendo a su propio comentario
      if (parent.user.id !== dto.user_id) {
        // Crear notificación de respuesta a comentario
        await this.notificationsService.createCommentReplyNotification(
          parent.user.id,
          newComment.id,
          newComment.user.username,
          parent.article.title,
        );
      }

      return newComment;
    }

    return this.prisma.comment.create({
      data: {
        article_id: articleId,
        user_id: dto.user_id,
        parent_id: null,
        content: dto.content.trim(),
      },
      include: {
        user: { select: { id: true, username: true, profile_pic: true } },
      },
    });
  }

  // Borrar. Si es padre, borra hijos primero.
  async hardDelete(commentId: number, userId: number) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { other_comment: { select: { id: true } } },
    });
    if (!existing) throw new NotFoundException('Comentario no encontrado.');

    // Obtener información del usuario que intenta eliminar
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role_id: true },
    });
    if (!user) throw new ForbiddenException('Usuario no encontrado.');

    // Verificar permisos: propietario del comentario O roles admin/editor (1 o 2)
    const canDelete =
      existing.user_id === userId || [1, 2].includes(user.role_id);
    if (!canDelete) {
      throw new ForbiddenException('No puedes borrar este comentario.');
    }

    if (existing.other_comment.length > 0) {
      await this.prisma.comment.deleteMany({ where: { parent_id: commentId } });
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { id: commentId, deleted: true };
  }
}
