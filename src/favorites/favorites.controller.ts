import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  HttpCode,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoriteQueryDto } from './dto/favorite-query.dto';
import { FavoriteBodyDto } from './dto/favorite-body.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Get()
  async getStatus(
    @Query() query: Omit<FavoriteQueryDto, 'userId'>,
    @CurrentUser() user: any,
  ) {
    const isFavorite = await this.favoritesService.isFavorite({
      userId: Number(user.id),
      type: query.type,
      name: query.name,
      artistName: query.artistName,
      location: query.location,
    });
    return { isFavorite };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post()
  @HttpCode(201)
  async addFavorite(@Body() body: FavoriteBodyDto, @CurrentUser() user: any) {
    await this.favoritesService.addFavorite({
      userId: Number(user.id),
      type: body.type,
      name: body.name,
      artistName: body.artistName,
      location: body.location,
    });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Delete()
  @HttpCode(204)
  async removeFavorite(
    @Query() query: FavoriteQueryDto,
    @CurrentUser() user: any,
  ) {
    await this.favoritesService.removeFavorite({
      userId: Number(user.id),
      type: query.type,
      name: query.name,
      artistName: query.artistName,
      location: query.location,
    });
  }
}
