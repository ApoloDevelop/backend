import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GeniusHit = {
  result: {
    id: number;
    title: string;
    full_title: string;
    title_with_featured: string;
    url: string;
    artist_names: string; // cadena con todos los artistas
    primary_artist: { name: string };
  };
};

@Injectable()
export class GeniusService {
  private rapidApiKey: string;
  private rapidApiHost: string;

  constructor(private configService: ConfigService) {
    this.rapidApiKey = this.configService.get('RAPIDAPI_KEY');
    this.rapidApiHost = this.configService.get('RAPIDAPI_GENIUS_HOST');
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
    };
  }

  private fold(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\u2019’]/g, "'")
      .trim();
  }

  private stripGeniusHeader(input: string | null | undefined): string | null {
    if (!input) return input ?? null;

    //espacios iniciales
    let s = input.replace(/^\uFEFF/, '');

    s = s.replace(
      /^\s*\[(?=[^\]]*(?:letra|lyrics|paroles|testo))[\s\S]*?\]\s*\n?/i,
      '',
    );

    return s.trimStart();
  }

  private decodeHtmlEntities(s: string | null | undefined): string | null {
    if (!s) return s ?? null;
    // numéricas decimales: &#1234;
    s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
    // numéricas hex: &#x1F600;
    s = s.replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
    // nombradas comunes:
    return s
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  private scoreCandidate(
    params: { title: string; artist: string },
    hit: GeniusHit,
  ): number {
    const title = params.title;
    const artist = this.fold(params.artist);

    const r = hit.result;
    const candTitleA = r.title;
    const candTitleB = r.title_with_featured || r.full_title || r.title;
    const primArtist = this.fold(r.primary_artist?.name || '');
    const allArtists = this.fold(r.artist_names || '');

    let score = 0;
    if (title && (title === candTitleA || title === candTitleB)) score += 6;
    else if (
      title &&
      (candTitleA.includes(title) || title.includes(candTitleA))
    )
      score += 3;

    if (artist) {
      if (artist === primArtist) score += 6;
      else if (allArtists.includes(artist)) score += 3;
    }

    // bonus por coincidencia exacta de título+artista en full_title
    const full = this.fold(r.full_title || '');
    if (full.includes(title) && full.includes(artist)) score += 2;

    return score;
  }

  private async search(query: string, perPage = 10, page = 1) {
    const url = `https://${this.rapidApiHost}/search/?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Error en Genius search: ${res.status} ${res.statusText} ${body}`,
      );
    }
    const json = await res.json();
    return (json?.hits ?? []) as GeniusHit[];
  }

  private async lyricsById(id: number) {
    const url = `https://${this.rapidApiHost}/song/lyrics/?id=${id}&text_format=plain`;

    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Error obteniendo lyrics: ${res.status} ${res.statusText} ${body}`,
      );
    }
    const json = await res.json();
    const lyr = json?.lyrics;
    if (!lyr) throw new NotFoundException('Lyrics no disponibles');

    const lyrics = this.decodeHtmlEntities(
      this.stripGeniusHeader(lyr?.lyrics?.body?.plain ?? null),
    );

    return lyrics;
  }

  async lyricsByTrack({ title, artist }: { title: string; artist: string }) {
    const query = `${title} ${artist}`.trim();
    console.log(query);
    const hits = await this.search(query, 10, 1);
    if (!hits.length)
      throw new NotFoundException('No se encontraron coincidencias en Genius');

    // ordena por score descendente
    const best = hits
      .map((h) => ({
        hit: h,
        score: this.scoreCandidate({ title, artist }, h),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score <= 0)
      throw new NotFoundException(
        'No se encontró una coincidencia suficientemente buena',
      );

    const id = best.hit.result.id;
    const meta = await this.lyricsById(id);

    return { lyrics: meta };
  }
}
