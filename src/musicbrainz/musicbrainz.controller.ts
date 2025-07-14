import {
  Controller,
  Get,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MusicbrainzService } from './musicbrainz.service';

@Controller('musicbrainz/artist')
export class MusicbrainzController {
  constructor(private readonly mb: MusicbrainzService) {}

  /** GET /musicbrainz/artist/match?spotifyId=...&name=... */
  @Get('match')
  async match(
    @Query('spotifyId') spotifyId: string,
    @Query('name') name: string,
  ) {
    const mbid = await this.mb.matchSpotifyArtist(spotifyId, name);
    if (!mbid)
      throw new NotFoundException('No se encontró un MBID coincidente');
    return { mbid };
  }

  @Get('similar-by-tags')
  async similarByTags(
    @Query('mbid') mbid: string,
    @Query('tagsLimit') tagsLimit?: string,
    @Query('perTag') perTag?: string,
    @Query('limit') limit?: string,
  ) {
    if (!mbid) throw new BadRequestException('mbid es obligatorio');
    const tl = tagsLimit ? +tagsLimit : undefined;
    const pt = perTag ? +perTag : undefined;
    const lm = limit ? +limit : undefined;
    return this.mb.fetchSimilarByTags(mbid, tl, pt, lm);
  }
}
