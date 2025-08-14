import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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
  async fetchAlbumByName(name: string, artistName: string) {
    const token = await this.getAccessToken();

    const parts = [`album:"${name}"`];
    if (artistName) parts.push(`artist:"${artistName}"`);
    const q = parts.join(' ');

    let res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&market=ES&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok)
      throw new InternalServerErrorException('Error buscando álbum en Spotify');

    let data = await res.json();
    let items = data.albums?.items ?? [];

    const targetAlbum = fold(name);
    const targetArtist = artistName ? fold(artistName) : null;

    let match = items.find(
      (a: any) =>
        fold(a.name) === targetAlbum &&
        (!targetArtist ||
          a.artists?.some((x: any) => fold(x.name) === targetArtist)),
    );
    if (match) return match;

    if (artistName) {
      const artist = await this.fetchArtistByName(artistName);
      if (artist) {
        res = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single,compilation,appears_on&market=ES&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          data = await res.json();
          items = data.items ?? [];
          match = items.find((a: any) => fold(a.name) === targetAlbum);
          if (match) return match;
        }
        //sin market
        res = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single,compilation,appears_on&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          data = await res.json();
          items = data.items ?? [];
          match = items.find((a: any) => fold(a.name) === targetAlbum);
          if (match) return match;
        }
      }
    }

    //Búsqueda global sin market
    res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      data = await res.json();
      items = data.albums?.items ?? [];
      match = items.find(
        (a: any) =>
          fold(a.name) === targetAlbum &&
          (!targetArtist ||
            a.artists?.some((x: any) => fold(x.name) === targetArtist)),
      );
      if (match) return match;
    }

    return null;
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
      tracks = tracks.concat(data.items);
      nextUrl = data.next;
    }

    return tracks;
  }

  //-------------CANCIONES-------------
  async fetchSongByName(name: string, albumName?: string, artistName?: string) {
    const token = await this.getAccessToken();

    const parts = [`track:"${name}"`];
    if (albumName) parts.push(`album:"${albumName}"`);
    if (artistName) parts.push(`artist:"${artistName}"`);
    const q = parts.join(' ');

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&market=ES&limit=50`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
      throw new InternalServerErrorException('Error buscando pista en Spotify');

    const data = await res.json();
    const items = data.tracks?.items ?? [];

    const targetName = fold(name);
    const targetAlbum = albumName ? fold(albumName) : null;
    const targetArt = artistName ? fold(artistName) : null;

    let match = items.find(
      (t: any) =>
        fold(t.name) === targetName &&
        (!targetAlbum || (t.album && fold(t.album.name) === targetAlbum)) &&
        (!targetArt || t.artists?.some((a: any) => fold(a.name) === targetArt)),
    );
    if (match) return match;

    //sin market
    const url2 = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=50`;
    const res2 = await fetch(url2, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const items2 = data2.tracks?.items ?? [];
      match = items2.find(
        (t: any) =>
          fold(t.name) === targetName &&
          (!targetAlbum || (t.album && fold(t.album.name) === targetAlbum)) &&
          (!targetArt ||
            t.artists?.some((a: any) => fold(a.name) === targetArt)),
      );
      if (match) return match;
    }

    if (albumName || artistName) {
      const album = artistName
        ? await this.fetchAlbumByName(albumName ?? '', artistName)
        : null;

      if (album?.id) {
        const tracks = await this.fetchAlbumTracks(album.id);
        const local = tracks.find((t: any) => fold(t.name) === targetName);
        if (local) return local;
      }
    }

    return null;
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
