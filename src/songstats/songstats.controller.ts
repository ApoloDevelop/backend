import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { SongstatsService } from './songstats.service';

@Controller('songstats')
export class SongstatsController {
  constructor(private readonly songstatsService: SongstatsService) {}

  @Get('track/info')
  async getTrackInfo(@Query('spotifyId') spotifyId: string) {
    if (!spotifyId) {
      throw new BadRequestException('spotifyId query param is required');
    }
    const data = await this.songstatsService.getTrackInfo(spotifyId);
    if (!data) {
      throw new NotFoundException('Track not found');
    }
    return data;
  }

  @Get('artist/info')
  async getArtistInfo(@Query('spotifyArtistId') spotifyArtistId: string) {
    if (!spotifyArtistId) {
      throw new BadRequestException('spotifyArtistId query param is required');
    }
    const data = await this.songstatsService.getArtistInfo(spotifyArtistId);
    if (!data) throw new NotFoundException('Artist not found');
    return data;
  }
}
