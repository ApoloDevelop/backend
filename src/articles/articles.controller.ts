import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ListArticlesDto } from './dto/list-articles.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  list(@Query() query: ListArticlesDto) {
    return this.articlesService.list(query);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3)
  @Post()
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: any) {
    return this.articlesService.create({ ...dto, author_id: user.id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: any,
  ) {
    if (user.role_id === 1 || user.role_id === 2) {
      return this.articlesService.update(id, dto);
    }
    // solo su propio artículo
    const ok = await this.articlesService.updateOwned(id, dto, user.id);
    if (!ok) throw new ForbiddenException('No puedes editar este artículo');
    return this.articlesService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    if (user.role_id === 1 || user.role_id === 2) {
      return this.articlesService.remove(id);
    }
    const ok = await this.articlesService.removeOwned(id, user.id);
    if (!ok) throw new ForbiddenException('No puedes borrar este artículo');
    return { ok: true };
  }

  @Get(':id/related')
  async getRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.articlesService.related(Number(id), Number(limit) || 3);
  }
}
