import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { RateDto } from './dto/rate.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('rate')
  async rate(@Body() dto: RateDto) {
    return this.reviewsService.rate(dto);
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

  @Post('vote')
  vote(
    @Body() body: { reviewId: number; value: 1 | -1; userId: number | string },
  ) {
    const reviewId = Number(body.reviewId);
    const userId = Number(body.userId);
    const value = Number(body.value) as 1 | -1;
    return this.reviewsService.voteReview(reviewId, userId, value);
  }
}
