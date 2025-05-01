import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { user } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers(): Promise<user[]> {
    return this.prisma.user.findMany();
  }

  // async findUserById(id: number): Promise<user> {
  //   return this.prisma.user.findUnique({
  //     where: {id}
  //   });
  // }

  async findUserByEmail(email: string): Promise<user> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async findUserByUsername(username: string): Promise<user> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserByPhone(phone: string): Promise<user> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async createUser(CreateUserDto: CreateUserDto): Promise<user> {
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
