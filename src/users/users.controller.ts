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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guard/optional-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

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

  @Get('exists')
  async checkIfExists(
    @Query('email') email?: string,
    @Query('username') username?: string,
  ) {
    const emailExists = email
      ? await this.usersService.findUserByEmail(email)
      : null;
    const usernameExists = username
      ? await this.usersService.findUserByUsername(username)
      : null;

    return {
      emailExists: !!emailExists,
      usernameExists: !!usernameExists,
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
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Param('id') targetId: string, @CurrentUser() user: any) {
    return this.usersService.followUser(Number(user.id), Number(targetId));
  }

  // Dejar de seguir (autenticado)
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@Param('id') targetId: string, @CurrentUser() user: any) {
    return this.usersService.unfollowUser(Number(user.id), Number(targetId));
  }

  // Resumen: counts + relación con el viewer (si va autenticado)
  // Si hay token, el guard no es obligatorio; pero si lo quieres opcional,
  // crea un guard opcional. Para simplicidad, lo dejamos sin guard:
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/follow-summary')
  async followSummary(
    @Param('id') profileId: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.getFollowSummary(
      user ? Number(user.id) : null,
      Number(profileId),
    );
  }

  @Get(':id/followers')
  async followers(
    @Param('id') profileId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ) {
    return this.usersService.listFollowers(
      Number(profileId),
      Number(skip),
      Number(take),
    );
  }

  @Get(':id/following')
  async following(
    @Param('id') profileId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ) {
    return this.usersService.listFollowing(
      Number(profileId),
      Number(skip),
      Number(take),
    );
  }
}
