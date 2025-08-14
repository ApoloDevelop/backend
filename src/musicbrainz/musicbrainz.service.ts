import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MusicbrainzService {
  private UA: string;

  constructor() {
    this.UA = `Apolo/1.0 (apolo@gmail.com)`;
  }

  private async searchByName(name: string, limit = 20) {
    const url = new URL('https://musicbrainz.org/ws/2/artist');
    url.searchParams.set('query', name);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.UA },
    });
    if (!res.ok)
      throw new InternalServerErrorException('Error buscando en MusicBrainz');
    const data = await res.json();
    return data.artists as Array<{ id: string }>;
  }

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

  async matchSpotifyArtist(spotifyId: string, name: string) {
    const spotifyUrl = `https://open.spotify.com/artist/${spotifyId}`;
    console.log(spotifyUrl);
    const candidates = await this.searchByName(name, 20);

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
    return null; // no se encuentra match por URL
  }

  private async fetchTags(
    mbid: string,
  ): Promise<Array<{ name: string; count: number }>> {
    const url =
      `https://musicbrainz.org/ws/2/artist/${mbid}` + '?fmt=json&inc=tags';
    const res = await fetch(url, { headers: { 'User-Agent': this.UA } });
    if (!res.ok) throw new InternalServerErrorException('Error fetching tags');
    const json = await res.json();
    console.log('Tags for MBID', mbid, ':', json.tags);
    return (json.tags || [])
      .map((t: any) => ({ name: t.name, count: t.count }))
      .sort((a, b) => b.count - a.count);
  }

  private async searchByTag(
    tag: string,
    limit: number,
  ): Promise<Array<{ id: string; name: string }>> {
    const query = `tag:"${tag}" AND type:Person`;
    const url = new URL('https://musicbrainz.org/ws/2/artist');
    url.searchParams.set('query', query);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.UA },
    });
    if (!res.ok)
      throw new InternalServerErrorException(
        `Error buscando por tag “${tag}” (${res.status})`,
      );
    const json = await res.json();
    return (json.artists || []).map((a: any) => ({
      id: a.id,
      name: a.name,
    }));
  }

  async fetchSimilarByTags(
    mbid: string,
    tagsLimit = 3,
    artistsPerTag = 5,
    resultLimit = 5,
  ): Promise<Array<{ id: string; name: string }>> {
    const tags = await this.fetchTags(mbid);
    const topTags = tags.slice(0, tagsLimit);

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

    return Array.from(bucket.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, resultLimit)
      .map(({ id, name }) => ({ id, name }));
  }

  async fetchArtistDetails(mbid: string) {
    const url =
      `https://musicbrainz.org/ws/2/artist/${mbid}?` +
      new URLSearchParams({
        fmt: 'json',
        inc: 'aliases+annotation',
      }).toString();

    const res = await fetch(url, {
      headers: { 'User-Agent': this.UA },
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Error fetching artist details (${res.status})`,
      );
    }
    const data = await res.json();

    const realAlias = Array.isArray(data.aliases)
      ? data.aliases.find((a: any) => a.type === 'Legal name')?.name
      : null;

    const fullName = realAlias || data.name;
    const birthDate = data['life-span']?.begin || null;
    const birthCountry = data['area']?.name || null;
    const birthCountryCode = data['country'] || null;
    const birthPlace = data['begin-area']?.name || null;
    const type = data.type || null;

    return {
      fullName,
      birthDate,
      birthCountry,
      birthCountryCode,
      birthPlace,
      type,
    };
  }
}
