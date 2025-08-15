import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SongstatsService } from './songstats.service';

@Controller('songstats')
export class SongstatsController {
  constructor(private readonly songstatsService: SongstatsService) {}

  @Get('track/info')
  async getTrackInfo(@Query('spotifyId') spotifyId: string) {
    const data = await this.songstatsService.getTrackInfo(spotifyId);
    if (!data) {
      throw new NotFoundException('Track not found');
    }
    return data;
  }
}
