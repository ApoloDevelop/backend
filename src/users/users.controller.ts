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

  // @Get(':id')
  // findUserById(@Param('id') id: string) {
  //   return this.usersService.findUserById(id);
  // }

  @Get('email/:email')
  findUserByEmail(@Param('email') email: string) {
    return this.usersService.findUserByEmail(email);
  }

  @Get('username/:username')
  findUserByUsername(@Param('username') username: string) {
    return this.usersService.findUserByUsername(username);
  }

  @Get('phone/:phone')
  findUserByPhone(@Param('phone') phone: string) {
    return this.usersService.findUserByPhone(phone);
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

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
}
