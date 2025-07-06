import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
            'base64',
          ),
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      throw new InternalServerErrorException(
        'Error obteniendo token de Spotify',
      );
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
    return this.accessToken;
  }

  async fetchArtistByName(name: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        'Error buscando artista en Spotify',
      );
    }
    const data = await res.json();
    return data.artists.items[0] || null;
  }

  async fetchAlbumByName(name: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=album&market=ES&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException('Error buscando álbum en Spotify');
    }
    const data = await res.json();
    return data.albums.items[0] || null;
  }

  async fetchSongByName(name: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=track&market=ES&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException('Error buscando pista en Spotify');
    }
    const data = await res.json();
    return data.tracks.items[0] || null;
  }

  async fetchArtistAlbums(artistId: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        'Error buscando álbumes del artista en Spotify',
      );
    }
    const data = await res.json();
    return data.items || [];
  }
}
