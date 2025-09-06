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

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.searchUsers(query, limitNum);
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Solo el propio usuario puede actualizar su perfil
    const targetUserId = Number(id);
    const currentUserId = Number(user.id);
    if (targetUserId !== currentUserId) {
      throw new NotFoundException('No tienes permisos para editar este perfil');
    }

    return this.usersService.update(targetUserId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    const targetUserId = Number(id);
    const currentUserId = Number(user.id);
    const isAdmin = user.role_id === 1;

    // Solo el propio usuario puede eliminar su cuenta, o un administrador puede eliminar cualquier cuenta
    if (targetUserId !== currentUserId && !isAdmin) {
      throw new NotFoundException(
        'No tienes permisos para eliminar esta cuenta',
      );
    }

    return this.usersService.deleteUser(targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Param('id') targetId: string, @CurrentUser() user: any) {
    return this.usersService.followUser(Number(user.id), Number(targetId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@Param('id') targetId: string, @CurrentUser() user: any) {
    return this.usersService.unfollowUser(Number(user.id), Number(targetId));
  }

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

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/followers')
  async followers(
    @Param('id') profileId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @CurrentUser() user: any,
  ) {
    return this.usersService.listFollowers(
      Number(profileId),
      Number(skip),
      Number(take),
      user ? Number(user.id) : null,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/following')
  async following(
    @Param('id') profileId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @CurrentUser() user: any,
  ) {
    return this.usersService.listFollowing(
      Number(profileId),
      Number(skip),
      Number(take),
      user ? Number(user.id) : null,
    );
  }
}
