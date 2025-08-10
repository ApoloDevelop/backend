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
  async getStatus(@Query() query: FavoriteQueryDto) {
    const isFavorite = await this.favoritesService.isFavorite(query);
    return { isFavorite };
  }

  @Post()
  @HttpCode(201)
  async addFavorite(@Body() body: FavoriteBodyDto) {
    await this.favoritesService.addFavorite(body);
    return { ok: true };
  }

  @Delete()
  @HttpCode(204)
  async removeFavorite(@Query() query: FavoriteQueryDto) {
    await this.favoritesService.removeFavorite(query);
  }
}
