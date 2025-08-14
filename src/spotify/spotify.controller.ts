import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('artist')
  async getArtistByName(@Query('name') name: string) {
    const artist = await this.spotifyService.fetchArtistByName(name);
    if (!artist) {
      throw new NotFoundException(`Artista no encontrado`);
    }
    return artist;
  }

  @Get('artist/albums')
  async getArtistAlbums(@Query('artistId') artistId: string) {
    return this.spotifyService.fetchArtistAlbums(artistId);
  }

  @Get('artist/top-tracks')
  async getTopTracks(@Query('artistId') artistId: string) {
    return this.spotifyService.fetchArtistTopTracks(artistId);
  }

  @Get('artist/releases')
  async getArtistReleases(@Query('artistId') artistId: string) {
    return this.spotifyService.fetchArtistReleases(artistId);
  }

  @Get('album')
  async getAlbumByName(@Query('name') name: string) {
    const album = await this.spotifyService.fetchAlbumByName(name);
    if (!album) {
      throw new NotFoundException(`Álbum no encontrado`);
    }
    return album;
  }

  @Get('album/tracks')
  async getAlbumTracks(@Query('albumId') albumId: string) {
    return this.spotifyService.fetchAlbumTracks(albumId);
  }

  @Get('track')
  async getSongByName(@Query('name') name: string) {
    return this.spotifyService.fetchSongByName(name);
  }
}
