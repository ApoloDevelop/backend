import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { user as User } from '@prisma/client';

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

  async findUserByPhone(phone: string): Promise<User> {
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const normalizedPhoneNoSpaces = normalizedPhone.replace(/\s+/g, '');
    return this.prisma.user.findUnique({
      where: { phone: normalizedPhoneNoSpaces },
    });
  }

  async createUser(CreateUserDto: CreateUserDto): Promise<User> {
    const { phone, ...rest } = CreateUserDto;

    const normalizedPhone = phone?.startsWith('+')
      ? phone
      : phone
        ? `+${phone}`
        : null;
    const normalizedPhoneNoSpaces = normalizedPhone?.replace(/\s+/g, '');

    return this.prisma.user.create({
      data: {
        ...rest,
        ...(normalizedPhoneNoSpaces ? { phone: normalizedPhoneNoSpaces } : {}),
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

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
