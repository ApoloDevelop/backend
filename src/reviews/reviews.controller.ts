import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { RateDto } from './dto/rate.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post('rate')
  async rate(@Body() dto: RateDto, @CurrentUser() user: any) {
    const isVerified = Number(user.role_id) === 4;
    return this.reviewsService.rate(
      { ...dto, userId: Number(user.id) },
      isVerified,
    );
  }

  @Get('artist/average')
  async getArtistReviewAverages(@Query('artistName') artistName: string) {
    if (!artistName) {
      throw new Error('artistName es obligatorio');
    }
    return this.reviewsService.getArtistReviewAverages(artistName);
  }

  @Get('artist/count')
  async getArtistReviewCount(@Query('artistName') artistName: string) {
    if (!artistName) {
      throw new Error('artistName es obligatorio');
    }
    return this.reviewsService.getArtistReviewCount(artistName);
  }

  @Get('artist/reviews')
  async getReviews(
    @Query('itemId') itemId: string,
    @Query('verified') verified: string,
  ) {
    const isVerified = verified === '1';
    return this.reviewsService.getReviewsByItem({
      itemId: parseInt(itemId, 10),
      verified: isVerified,
    });
  }

  @Get('album/stats')
  async getAlbumStats(
    @Query('albumName') albumName: string,
    @Query('artistName') artistName?: string,
  ) {
    if (!albumName) throw new Error('El nombre del álbum es obligatorio');
    return this.reviewsService.getAlbumReviewStats(albumName, artistName);
  }

  @Get('item/reviews')
  getByItem(
    @Query('itemId', ParseIntPipe) itemId: number,
    @Query('verified', ParseIntPipe) verifiedInt: number,
    @Query('userId') userId?: string,
    @Query('take') takeStr?: string,
    @Query('cursor') cursorStr?: string,
  ) {
    const take = takeStr ? Math.min(50, Math.max(1, Number(takeStr))) : 10;
    const cursor = cursorStr ? Number(cursorStr) : undefined;

    return this.reviewsService.getReviewsByItem({
      itemId,
      verified: verifiedInt === 1,
      userId: userId ? Number(userId) : undefined,
      take,
      cursor,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post('vote')
  vote(
    @Body() body: { reviewId: number; value: 1 | -1 },
    @CurrentUser() user: any,
  ) {
    const reviewId = Number(body.reviewId);
    const userId = Number(user.id);
    const value = Number(body.value) as 1 | -1;
    return this.reviewsService.voteReview(reviewId, userId, value);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Get('mine')
  async getMyReview(
    @Query('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: any,
  ) {
    const r = await this.reviewsService.getMyReviewForItem(
      itemId,
      Number(user.id),
    );
    return r ?? null;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5) // cualquier user logueado puede intentar borrar; la política se aplica en el service
  @Delete(':id')
  removeById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.reviewsService.removeByPolicy(id, {
      id: Number(user.id),
      role_id: Number(user.role_id),
    });
  }
}
