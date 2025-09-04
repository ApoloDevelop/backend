import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { user as User } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findUserById(id: number): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async findUserByUsername(username: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new BadRequestException('User not found');

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const lastUpdate = user.username_last_update;
      const now = new Date();
      if (lastUpdate) {
        const diff = now.getTime() - new Date(lastUpdate).getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days < 30) {
          throw new BadRequestException(
            'Solo puedes cambiar tu nombre de usuario una vez cada 30 días.',
          );
        }
      }
      updateUserDto.username_last_update = now;
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcryptjs.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async deleteUser(userId: number) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Eliminar el usuario y todas sus relaciones (Prisma se encarga de las relaciones en cascada)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Cuenta eliminada exitosamente' };
  }

  async followUser(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    // Verificar si ya sigue al usuario
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        seguidor_id_seguido_id: {
          seguidor_id: currentUserId,
          seguido_id: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return { following: true };
    }

    // Crear el seguimiento
    await this.prisma.follow.create({
      data: {
        seguidor_id: currentUserId,
        seguido_id: targetUserId,
      },
    });

    // Obtener información del seguidor para la notificación
    const follower = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { username: true },
    });

    // Crear notificación
    if (follower) {
      await this.notificationsService.createNewFollowerNotification(
        targetUserId,
        currentUserId,
        follower.username,
      );
    }

    return { following: true };
  }

  async unfollowUser(currentUserId: number, targetUserId: number) {
    await this.prisma.follow.deleteMany({
      where: {
        seguidor_id: currentUserId,
        seguido_id: targetUserId,
      },
    });
    return { following: false };
  }

  async getFollowCounts(userId: number) {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { seguido_id: userId } }),
      this.prisma.follow.count({ where: { seguidor_id: userId } }),
    ]);
    return { followers, following };
  }

  async getFollowSummary(viewerId: number | null, profileUserId: number) {
    const counts = await this.getFollowCounts(profileUserId);

    let isFollowing = false;
    let isFollowedBy = false;

    if (viewerId) {
      const [a, b] = await Promise.all([
        this.prisma.follow.count({
          where: { seguidor_id: viewerId, seguido_id: profileUserId },
        }),
        this.prisma.follow.count({
          where: { seguidor_id: profileUserId, seguido_id: viewerId },
        }),
      ]);
      isFollowing = a > 0;
      isFollowedBy = b > 0;
    }

    return { ...counts, isFollowing, isFollowedBy };
  }

  async listFollowers(
    userId: number,
    skip = 0,
    take = 20,
    currentUserId?: number,
  ) {
    const rows = await this.prisma.follow.findMany({
      where: { seguido_id: userId },
      skip,
      take,
      orderBy: { fecha_seguimiento: 'desc' },
      include: {
        user_follow_seguidor_idTouser: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profile_pic: true,
          },
        },
      },
    });

    // normaliza a lista de usuarios con información de seguimiento
    const users = rows.map((r) => r.user_follow_seguidor_idTouser);

    // Si hay usuario actual, verificar qué usuarios está siguiendo
    if (currentUserId) {
      const followingIds = await this.prisma.follow.findMany({
        where: {
          seguidor_id: currentUserId,
          seguido_id: { in: users.map((u) => u.id) },
        },
        select: { seguido_id: true },
      });

      const followingSet = new Set(followingIds.map((f) => f.seguido_id));

      return users.map((user) => ({
        ...user,
        isFollowing:
          user.id !== currentUserId ? followingSet.has(user.id) : null,
      }));
    }

    return users.map((user) => ({ ...user, isFollowing: null }));
  }

  async listFollowing(
    userId: number,
    skip = 0,
    take = 20,
    currentUserId?: number,
  ) {
    const rows = await this.prisma.follow.findMany({
      where: { seguidor_id: userId },
      skip,
      take,
      orderBy: { fecha_seguimiento: 'desc' },
      include: {
        user_follow_seguido_idTouser: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profile_pic: true,
          },
        },
      },
    });

    // normaliza a lista de usuarios con información de seguimiento
    const users = rows.map((r) => r.user_follow_seguido_idTouser);

    // Si hay usuario actual, verificar qué usuarios está siguiendo
    if (currentUserId) {
      const followingIds = await this.prisma.follow.findMany({
        where: {
          seguidor_id: currentUserId,
          seguido_id: { in: users.map((u) => u.id) },
        },
        select: { seguido_id: true },
      });

      const followingSet = new Set(followingIds.map((f) => f.seguido_id));

      return users.map((user) => ({
        ...user,
        isFollowing:
          user.id !== currentUserId ? followingSet.has(user.id) : null,
      }));
    }

    return users.map((user) => ({ ...user, isFollowing: null }));
  }

  async searchUsers(query: string, limit = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: searchTerm,
            },
          },
          {
            fullname: {
              contains: searchTerm,
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        profile_pic: true,
      },
      take: limit,
      orderBy: [
        {
          username: 'asc',
        },
      ],
    });
  }

  // Método para actualizar usuario (simple)
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Método para buscar usuario por token de reset
  async findUserByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        reset_password_token: token,
      },
    });
  }
}
