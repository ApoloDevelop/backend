import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  // GET /articles/:articleId/comments?limit=&cursor=
  @Get('articles/:articleId/comments')
  async listForArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Query() query: ListCommentsDto,
  ) {
    return this.comments.listForArticle(articleId, query);
  }

  // POST /articles/:articleId/comments  (body: { user_id, content, parent_id? })
  @Post('articles/:articleId/comments')
  async create(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(articleId, dto);
  }

  // DELETE /comments/:id  (body: { user_id })
  @Delete('comments/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Body('user_id', ParseIntPipe) user_id: number,
  ) {
    return this.comments.hardDelete(id, user_id);
  }
}
