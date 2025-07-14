import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MusicbrainzService {
  private UA: string;

  constructor(private configService: ConfigService) {
    const email = this.configService.get<string>('GMAIL');
    this.UA = `Apolo/1.0 (${email})`;
  }

  /** 1) Busca candidatos por nombre */
  private async searchByName(name: string, limit = 5) {
    const url = new URL('https://musicbrainz.org/ws/2/artist');
    url.searchParams.set('query', name);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.UA },
    });
    if (!res.ok) throw new Error('Error buscando en MusicBrainz');
    const data = await res.json();
    return data.artists as Array<{ id: string }>;
  }

  /** 2) Trae relaciones de URL para un MBID dado */
  private async fetchWithRels(mbid: string) {
    const url =
      `https://musicbrainz.org/ws/2/artist/${mbid}` + '?fmt=json&inc=url-rels';
    console.log('Fetching relations for MBID:', mbid);
    console.log('Request URL:', url);
    const res = await fetch(url, { headers: { 'User-Agent': this.UA } });
    if (!res.ok) return null;
    return res.json() as Promise<{
      relations: Array<{ type: string; url: { resource: string } }>;
    }>;
  }

  /** 3) Empareja por URL de Spotify */
  async matchSpotifyArtist(spotifyId: string, name: string) {
    const spotifyUrl = `https://open.spotify.com/artist/${spotifyId}`;
    console.log(spotifyUrl);
    const candidates = await this.searchByName(name, 5);

    for (const c of candidates) {
      const detail = await this.fetchWithRels(c.id);
      if (!detail) continue;
      const found = detail.relations.find(
        (r) => r.type === 'free streaming' && r.url.resource === spotifyUrl,
      );
      if (found) {
        console.log(`Match encontrado: ${c.id} para ${name}`);
        return c.id; // este MBID es el match exacto
      }
    }
    return null; // no encontramos match por URL
  }

  private async fetchTags(
    mbid: string,
  ): Promise<Array<{ name: string; count: number }>> {
    const url =
      `https://musicbrainz.org/ws/2/artist/${mbid}` + '?fmt=json&inc=tags';
    const res = await fetch(url, { headers: { 'User-Agent': this.UA } });
    if (!res.ok) throw new Error('Error fetching tags');
    const json = await res.json();
    console.log('Tags for MBID', mbid, ':', json.tags);
    return (json.tags || [])
      .map((t: any) => ({ name: t.name, count: t.count }))
      .sort((a, b) => b.count - a.count);
  }

  /** 2️⃣ Busca artistas por tag */
  private async searchByTag(
    tag: string,
    limit: number,
  ): Promise<Array<{ id: string; name: string }>> {
    // Encerramos el tag en comillas y forzamos Person
    const query = `tag:"${tag}" AND type:Person`;
    const url = new URL('https://musicbrainz.org/ws/2/artist');
    url.searchParams.set('query', query);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.UA },
    });
    if (!res.ok)
      throw new Error(`Error buscando por tag “${tag}” (${res.status})`);
    const json = await res.json();
    return (json.artists || []).map((a: any) => ({
      id: a.id,
      name: a.name,
    }));
  }

  /**
   * 3️⃣ Empareja: obtén topTags (hasta `tagsLimit`), busca `artistsPerTag` por cada uno,
   *    agrupa, quita duplicados y excluye el mbid original.
   */
  async fetchSimilarByTags(
    mbid: string,
    tagsLimit = 3,
    artistsPerTag = 5,
    resultLimit = 5,
  ): Promise<Array<{ id: string; name: string }>> {
    // 1) Tags ordenadas por count
    const tags = await this.fetchTags(mbid);
    const topTags = tags.slice(0, tagsLimit); // ya ordenadas desc

    // 2) Bucket para acumular score
    const bucket = new Map<
      string,
      { id: string; name: string; score: number }
    >();

    for (const { name: tagName, count: tagCount } of topTags) {
      const candidates = await this.searchByTag(tagName, artistsPerTag);
      for (const art of candidates) {
        if (art.id === mbid) continue;
        const entry = bucket.get(art.id);
        if (entry) {
          entry.score += tagCount; // sumamos el peso del tag
        } else {
          bucket.set(art.id, { ...art, score: tagCount });
        }
      }
    }

    // 3) Ordenamos por score y limitamos
    return Array.from(bucket.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, resultLimit)
      .map(({ id, name }) => ({ id, name }));
  }
}
