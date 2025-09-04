import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationDto,
  NotificationType,
} from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Crear una nueva notificación
  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profile_pic: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        follower: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profile_pic: true,
          },
        },
        review: {
          select: {
            id: true,
            title: true,
            item: {
              select: {
                id: true,
                item_type: true,
                item_id: true,
                artist: {
                  select: {
                    name: true,
                  },
                },
                album: {
                  select: {
                    name: true,
                    album_artist: {
                      select: {
                        artist: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                track: {
                  select: {
                    title: true,
                    track_artist: {
                      select: {
                        artist: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                    track_album: {
                      select: {
                        album: {
                          select: {
                            name: true,
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
  }

  // Obtener notificaciones de un usuario
  async findByUserId(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const notifications = await this.prisma.notification.findMany({
      where: { user_id: userId },
      include: {
        comment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
                fullname: true,
                profile_pic: true,
              },
            },
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        follower: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profile_pic: true,
          },
        },
        review: {
          select: {
            id: true,
            title: true,
            item: {
              select: {
                id: true,
                item_type: true,
                item_id: true,
                artist: {
                  select: {
                    name: true,
                  },
                },
                album: {
                  select: {
                    name: true,
                    album_artist: {
                      select: {
                        artist: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                track: {
                  select: {
                    title: true,
                    track_artist: {
                      select: {
                        artist: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                    track_album: {
                      select: {
                        album: {
                          select: {
                            name: true,
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
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.notification.count({
      where: { user_id: userId },
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener el número de notificaciones no leídas
  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  // Marcar notificación como leída
  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        user_id: userId,
      },
      data: {
        is_read: true,
      },
    });
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  // Eliminar notificación
  async remove(id: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        user_id: userId,
      },
    });
  }

  // Métodos para crear notificaciones específicas

  // Notificación de respuesta a comentario
  async createCommentReplyNotification(
    recipientUserId: number,
    commentId: number,
    replierUsername: string,
    articleTitle: string,
  ) {
    return this.create({
      user_id: recipientUserId,
      type: NotificationType.COMMENT_REPLY,
      title: 'Nueva respuesta a tu comentario',
      message: `${replierUsername} respondió a tu comentario en "${articleTitle}"`,
      comment_id: commentId,
    });
  }

  // Notificación de nuevo seguidor
  async createNewFollowerNotification(
    followedUserId: number,
    followerId: number,
    followerUsername: string,
  ) {
    return this.create({
      user_id: followedUserId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'Nuevo seguidor',
      message: `${followerUsername} comenzó a seguirte`,
      follower_id: followerId,
    });
  }

  // Notificación de upvote en review
  async createReviewUpvoteNotification(
    reviewOwnerId: number,
    reviewId: number,
    voterUsername: string,
    reviewTitle: string,
  ) {
    return this.create({
      user_id: reviewOwnerId,
      type: NotificationType.REVIEW_UPVOTE,
      title: 'Tu review recibió un upvote',
      message: `A ${voterUsername} le gustó tu review "${reviewTitle}"`,
      review_id: reviewId,
    });
  }
}
