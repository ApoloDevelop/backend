import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  HttpCode,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoriteQueryDto } from './dto/favorite-query.dto';
import { FavoriteBodyDto } from './dto/favorite-body.dto';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getIsFavorite(@Query() query: FavoriteQueryDto) {
    const { userId, artistName } = query;
    const isFavorite = await this.favoritesService.isFavorite(
      userId,
      artistName,
    );
    return { isFavorite };
  }

  @Post()
  @HttpCode(201)
  async addFavorite(@Body() body: FavoriteBodyDto) {
    const { user, artistName } = body;
    await this.favoritesService.addFavorite(user, artistName);
  }

  @Delete()
  @HttpCode(204)
  async removeFavorite(@Query() query: FavoriteQueryDto) {
    const { userId, artistName } = query;
    await this.favoritesService.removeFavorite(userId, artistName);
  }
}
