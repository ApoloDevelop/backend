import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { GeniusService } from './genius.service';

@Controller('genius')
export class GeniusController {
  constructor(private readonly geniusService: GeniusService) {}

  @Get('lyrics/by-track')
  async lyricsByTrack(
    @Query('title') title?: string,
    @Query('artist') artist?: string,
  ) {
    if (!title || !artist)
      throw new NotFoundException('Faltan parámetros title y artist');
    return this.geniusService.lyricsByTrack({ title, artist });
  }
}
