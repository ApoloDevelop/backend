import { Controller, Post, Body } from '@nestjs/common';
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
}
