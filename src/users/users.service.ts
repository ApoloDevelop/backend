import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { user as User } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    // Upsert idempotente por la única compuesta (seguidor_id, seguido_id)
    await this.prisma.follow.upsert({
      where: {
        seguidor_id_seguido_id: {
          seguidor_id: currentUserId,
          seguido_id: targetUserId,
        },
      },
      update: {},
      create: {
        seguidor_id: currentUserId,
        seguido_id: targetUserId,
      },
    });

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

  async listFollowers(userId: number, skip = 0, take = 20) {
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

    // normaliza a lista de usuarios
    return rows.map((r) => r.user_follow_seguidor_idTouser);
  }

  async listFollowing(userId: number, skip = 0, take = 20) {
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

    return rows.map((r) => r.user_follow_seguido_idTouser);
  }
}
