import { Injectable } from '@nestjs/common';
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

  // async findUserById(id: number): Promise<user> {
  //   return this.prisma.user.findUnique({
  //     where: {id}
  //   });
  // }

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
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async createUser(CreateUserDto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: CreateUserDto,
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
