import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('artist')
  async getArtistByName(@Query('name') name: string) {
    return this.spotifyService.fetchArtistByName(name);
  }

  @Get('artist/albums')
  async getArtistAlbums(@Query('artistId') artistId: string) {
    return this.spotifyService.fetchArtistAlbums(artistId);
  }

  @Get('artist/top-tracks')
  async getTopTracks(@Query('artistId') artistId: string) {
    return this.spotifyService.fetchArtistTopTracks(artistId);
  }

  @Get('album')
  async getAlbumByName(@Query('name') name: string) {
    return this.spotifyService.fetchAlbumByName(name);
  }

  @Get('track')
  async getSongByName(@Query('name') name: string) {
    return this.spotifyService.fetchSongByName(name);
  }

  // @Get('artist/bio')
  // async getArtistBio(@Query('name') name: string) {
  //   // 1) Last.fm

  //   // 3) IA: necesitamos géneros, discografía y top tracks
  //   const artist = await this.spotifyService.fetchArtistByName(name);
  //   const uri = artist?.uri;

  //   const generated = await this.spotifyService.generateBioWithAI({
  //     name: artist.name,
  //     URI: uri,
  //   });

  //   return { origin: 'ai', text: generated };
  // }
}
