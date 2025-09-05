import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('coordinates')
  async getCoordinates(
    @Query('city') city?: string,
    @Query('country') country?: string,
  ) {
    if (!city || !country)
      throw new NotFoundException('Faltan parámetros city y country');
    return this.geoService.geocodeCityCountry(city, country);
  }
}
