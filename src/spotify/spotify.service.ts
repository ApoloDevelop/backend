import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  // private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
  }

  //-------------AUTENTICACION-------------
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

  //-------------ARTISTAS-------------
  async fetchArtistByName(name: string) {
    const token = await this.getAccessToken();
    console.log(encodeURIComponent(name));
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`,
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
    const items = data.artists.items as Array<{
      name: string;
      id: string;
      images: Array<{ url: string }>;
    }>;
    const exact = items.find(
      (a) => a.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    return exact || null;
  }

  async fetchArtistTopTracks(artistId: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=ES`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new InternalServerErrorException('Error en top-tracks');
    const data = await res.json();
    return data.tracks.slice(0, 5);
  }

  async fetchArtistReleases(artistId: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&market=ES`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        'Error buscando lanzamientos del artista en Spotify',
      );
    }
    const data = await res.json();
    return data.items || [];
  }

  //-------------ÁLBUMES-------------
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
    const items = data.albums.items as Array<{
      name: string;
      id: string;
      images: Array<{ url: string }>;
      label: string;
      artists: Array<{ name: string; id: string }>;
      release_date: string;
      uri: string;
    }>;

    // Buscar coincidencia exacta
    const exact = items.find(
      (album) => album.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    return exact || null;
  }

  async fetchAlbumTracks(albumId: string) {
    const token = await this.getAccessToken();
    let tracks: any[] = [];
    let nextUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks`;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new InternalServerErrorException(
          'Error buscando pistas del álbum',
        );
      }

      const data = await res.json();
      tracks = tracks.concat(data.items); // Agregar las pistas actuales
      nextUrl = data.next; // Actualizar la URL para la siguiente página
    }

    return tracks;
  }

  //-------------CANCIONES-------------
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
    const items = data.tracks.items as Array<{
      id: string;
      name: string;
      duration_ms: number;
      explicit: boolean;
      album: {
        id: string;
        name: string;
        images: Array<{ url: string }>;
        release_date: string;
      };
      artists: Array<{ id: string; name: string }>;
      external_urls: { spotify: string };
    }>;
    return data.tracks.items[0] || null;
  }

  async fetchArtistAlbums(artistId: string) {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=5`,
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
