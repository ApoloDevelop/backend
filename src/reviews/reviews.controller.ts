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
      birthdate?: Date;
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
}
