// src/geo/geo.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeoService {
  private userAgent: string;

  constructor(private configService: ConfigService) {
    this.userAgent = this.configService.get<string>('USER_AGENT');
  }

  async geocodeCityCountry(city: string, country: string) {
    if (!city || !country)
      throw new BadRequestException('city y country requeridos');
    const params = new URLSearchParams({
      format: 'json',
      city,
      country,
      addressdetails: '0',
      limit: '1',
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    console.log('Geocoding URL:', url);
    const res = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
    });
    if (!res.ok) throw new InternalServerErrorException('Error geocodificando');
    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (!data?.length)
      throw new BadRequestException(
        'No se encontraron coords para esa ciudad/país',
      );
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
}
