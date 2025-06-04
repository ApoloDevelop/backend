import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get('email/:email')
  async findUserByEmail(@Param('email') email: string) {
    return await this.usersService.findUserByEmail(email);
  }

  @Get('username/:username')
  async findUserByUsername(@Param('username') username: string) {
    return await this.usersService.findUserByUsername(username);
  }

  @Get('phone/:phone')
  async findUserByPhone(@Param('phone') phone: string) {
    return await this.usersService.findUserByPhone(phone);
  }

  @Get('exists')
  async checkIfExists(
    @Query('email') email?: string,
    @Query('username') username?: string,
    @Query('phone') phone?: string,
  ) {
    const emailExists = email
      ? await this.usersService.findUserByEmail(email)
      : null;
    const usernameExists = username
      ? await this.usersService.findUserByUsername(username)
      : null;
    const phoneExists = phone
      ? await this.usersService.findUserByPhone(phone)
      : null;

    return {
      emailExists: !!emailExists,
      usernameExists: !!usernameExists,
      phoneExists: !!phoneExists,
    };
  }

  @Get(':id')
  async findUserById(@Param('id') id: string) {
    const numId = Number(id);
    const user = await this.usersService.findUserById(numId);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log('Body received for update:', updateUserDto);
    return this.usersService.update(+id, updateUserDto);
  }
}
