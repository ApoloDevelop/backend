import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY no está definida');
    }
    this.openai = new OpenAI({ apiKey: openaiKey });
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

  //   async generateBioWithAI(input: {
  //     name: string;
  //     URI: string;
  //   }): Promise<string> {
  //     const { name, URI } = input;

  //     const userPrompt = `
  // Eres un redactor musical. Crea una biografía breve (4–5 líneas) en español para el artista "${name}".
  // Para que tengas más claro quién es, esta es su URI de Spotify: ${URI}.
  // Quiero la información más actualizada posible, debe ser reciente (año 2025).
  // menciona qué géneros canta o toca, sus álbumes recientes y sus canciones más populares.
  // Menciona también su impacto en la música actual y sus próximos proyectos, si tiene.
  // Habla de su estilo y logros, de cuando y dónde nació y de su impacto en la música actual.
  // Sé claro, cercano y evita clichés.
  //     `.trim();

  //     try {
  //       const resp = await this.openai.chat.completions.create({
  //         model: 'gpt-4.1-mini',
  //         messages: [
  //           {
  //             role: 'system',
  //             content: 'Eres un redactor de biografías musicales.',
  //           },
  //           { role: 'user', content: userPrompt },
  //         ],
  //         temperature: 0.7,
  //         max_tokens: 200,
  //       });

  //       const content = resp.choices?.[0].message?.content;
  //       if (!content) throw new Error('Sin contenido en la respuesta de OpenAI');
  //       return content.trim();
  //     } catch (err) {
  //       console.error('Error generando bio con IA:', err);
  //       throw new InternalServerErrorException(
  //         'No se pudo generar biografía con IA',
  //       );
  //     }
  //   }
}
