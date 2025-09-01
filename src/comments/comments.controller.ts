import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('articles/:articleId/comments')
  async listForArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Query() query: ListCommentsDto,
  ) {
    return this.comments.listForArticle(articleId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:articleId/comments')
  async create(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.comments.create(articleId, { ...dto, user_id: user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.comments.hardDelete(id, user.id);
  }
}
