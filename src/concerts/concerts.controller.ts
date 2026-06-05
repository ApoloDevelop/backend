import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ConcertsService } from './concerts.service';

@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get('artist/events')
  async getArtistEvents(@Query('artistName') artistName: string) {
    if (!artistName) throw new BadRequestException('artistName is required');
    return this.concertsService.getArtistEventInfo(artistName);
  }

  // Lightweight: only upcoming events. Used by the artist-page sidebar.
  @Get('artist/upcoming')
  async getArtistUpcoming(@Query('artistName') artistName: string) {
    if (!artistName) throw new BadRequestException('artistName is required');
    return this.concertsService.getArtistUpcomingInfo(artistName);
  }
}
