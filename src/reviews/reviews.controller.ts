import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('artist')
  async rateArtist(
    @Body()
    dto: {
      artistName: string;
      score: number;
      comment?: string;
      userId: number;
    },
  ) {
    return this.reviewsService.rateArtist(dto);
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
}
