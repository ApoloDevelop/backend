import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ConcertsEvent {
  title: string | null;
  date: string | null;
  link: string | null;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ConcertsArtistEventInfo {
  counts: {
    citiesUpcoming: number;
    countriesUpcoming: number;
    eventsUpcoming: number;
  };
  upcoming: ConcertsEvent[];
  past: ConcertsEvent[];
}

const COUNTRY_ISO2: Record<string, string> = {
  Afghanistan: 'AF', Albania: 'AL', Algeria: 'DZ', Argentina: 'AR',
  Australia: 'AU', Austria: 'AT', Bahrain: 'BH', Belgium: 'BE',
  Bolivia: 'BO', Brazil: 'BR', Bulgaria: 'BG', Canada: 'CA',
  Chile: 'CL', China: 'CN', Colombia: 'CO', Croatia: 'HR',
  'Czech Republic': 'CZ', Czechia: 'CZ', Denmark: 'DK', Ecuador: 'EC',
  Egypt: 'EG', Estonia: 'EE', Finland: 'FI', France: 'FR',
  Germany: 'DE', Greece: 'GR', Hungary: 'HU', India: 'IN',
  Indonesia: 'ID', Ireland: 'IE', Israel: 'IL', Italy: 'IT',
  Japan: 'JP', Jordan: 'JO', Kazakhstan: 'KZ', Kuwait: 'KW',
  Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Malaysia: 'MY',
  Mexico: 'MX', Morocco: 'MA', Netherlands: 'NL', 'New Zealand': 'NZ',
  Nigeria: 'NG', Norway: 'NO', Oman: 'OM', Paraguay: 'PY',
  Peru: 'PE', Philippines: 'PH', Poland: 'PL', Portugal: 'PT',
  Qatar: 'QA', Romania: 'RO', Russia: 'RU', 'Saudi Arabia': 'SA',
  Serbia: 'RS', Singapore: 'SG', Slovakia: 'SK', Slovenia: 'SI',
  'South Africa': 'ZA', 'South Korea': 'KR', Spain: 'ES',
  Sweden: 'SE', Switzerland: 'CH', Taiwan: 'TW', Thailand: 'TH',
  Turkey: 'TR', Ukraine: 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', Uruguay: 'UY',
  Venezuela: 'VE', Vietnam: 'VN',
};

const EMPTY_RESULT: ConcertsArtistEventInfo = {
  counts: { citiesUpcoming: 0, countriesUpcoming: 0, eventsUpcoming: 0 },
  upcoming: [],
  past: [],
};

@Injectable()
export class ConcertsService {
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;

  // Rate limiter: the RapidAPI plan allows 2 requests/second. We reserve a
  // time slot for the START of each request so concurrent callers (artist
  // sidebar + events page + venue enrichment) never burst past the quota.
  private readonly MIN_REQUEST_GAP_MS = 550;
  private nextRequestSlot = 0;

  // In-memory cache (and in-flight dedup) keyed by artist name. Both the
  // sidebar and the events page hit the same endpoint; caching avoids
  // re-spending the request budget on every page load.
  private readonly CACHE_TTL_MS = 30 * 60 * 1000;
  private readonly cache = new Map<
    string,
    { promise: Promise<ConcertsArtistEventInfo>; expires: number }
  >();

  constructor(private configService: ConfigService) {
    this.rapidApiKey = this.configService.get('RAPIDAPI_KEY');
    this.rapidApiHost = this.configService.get('RAPIDAPI_CONCERTS_HOST');
  }

  private headers() {
    return {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Spaces the start of every RapidAPI request by MIN_REQUEST_GAP_MS to stay
  // under the 2 req/sec quota, regardless of how many callers fire at once.
  private async throttledFetch(url: string): Promise<Response> {
    const now = Date.now();
    const slot = Math.max(now, this.nextRequestSlot);
    this.nextRequestSlot = slot + this.MIN_REQUEST_GAP_MS;
    const wait = slot - now;
    if (wait > 0) await this.delay(wait);
    return fetch(url, {
      method: 'GET',
      headers: this.headers(),
      signal: AbortSignal.timeout(10000),
    });
  }

  private async searchArtistId(
    artistName: string,
  ): Promise<{ id: number; on_tour: boolean } | null> {
    const url = new URL(`https://${this.rapidApiHost}/search`);
    url.searchParams.set('keyword', artistName);
    url.searchParams.set('types', 'artist');

    try {
      const res = await this.throttledFetch(url.toString());
      if (!res.ok) return null;
      const json = await res.json();
      const artists: Array<{
        id: number;
        name: string;
        on_tour: boolean;
        verified: boolean;
        tracker_count: number;
      }> = json?.artists ?? [];

      const lower = artistName.toLowerCase();
      const exact = artists.find(
        (a) => a.name.toLowerCase() === lower && a.verified,
      );
      if (exact) return { id: exact.id, on_tour: exact.on_tour };

      const verified = artists.find((a) => a.verified);
      if (verified) return { id: verified.id, on_tour: verified.on_tour };

      return artists.length
        ? { id: artists[0].id, on_tour: artists[0].on_tour }
        : null;
    } catch {
      return null;
    }
  }

  private async fetchArtistEvents(
    artistId: number,
  ): Promise<{ events: any[]; venues: any[] }> {
    const url = new URL(`https://${this.rapidApiHost}/artist/events`);
    url.searchParams.set('artist_id', String(artistId));

    try {
      const res = await this.throttledFetch(url.toString());
      if (!res.ok) return { events: [], venues: [] };
      return await res.json();
    } catch {
      return { events: [], venues: [] };
    }
  }

  private async fetchArtistPastEvents(
    artistId: number,
    before: string,
  ): Promise<any[]> {
    const url = new URL(`https://${this.rapidApiHost}/artist/past`);
    url.searchParams.set('artist_id', String(artistId));
    url.searchParams.set('before', before);

    try {
      const res = await this.throttledFetch(url.toString());
      if (!res.ok) return [];
      const json = await res.json();
      return (json?.events ?? []).slice(0, 20);
    } catch {
      return [];
    }
  }

  private async fetchVenueInfo(venueId: number): Promise<any | null> {
    const url = new URL(`https://${this.rapidApiHost}/venue/infos`);
    url.searchParams.set('venue_id', String(venueId));

    try {
      const res = await this.throttledFetch(url.toString());
      if (!res.ok) return null;
      const json = await res.json();
      // Response is nested: { data: { venue: { ... } } }
      return json?.data?.venue ?? null;
    } catch {
      return null;
    }
  }

  private normalizeEvents(
    apiEvents: any[],
    venueMap: Record<number, any>,
  ): ConcertsEvent[] {
    return apiEvents.map((e) => {
      const venue = venueMap[e.venue_id] ?? null;
      const countryName: string | null = venue?.country ?? null;
      return {
        title: e.title ?? venue?.name ?? null,
        date: e.starts_at ?? null,
        link: `https://www.bandsintown.com/e/${e.id}`,
        city: venue?.city ?? null,
        region: venue?.region ?? null,
        countryCode: countryName ? (COUNTRY_ISO2[countryName] ?? null) : null,
        lat: venue?.latitude ?? null,
        lng: venue?.longitude ?? null,
      };
    });
  }

  async getArtistEventInfo(artistName: string): Promise<ConcertsArtistEventInfo> {
    const key = artistName.toLowerCase().trim();
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;

    const promise = this.computeArtistEventInfo(artistName);
    this.cache.set(key, { promise, expires: Date.now() + this.CACHE_TTL_MS });
    // On failure, evict so the next request retries instead of caching the error.
    promise.catch(() => this.cache.delete(key));
    return promise;
  }

  private async computeArtistEventInfo(
    artistName: string,
  ): Promise<ConcertsArtistEventInfo> {
    const artist = await this.searchArtistId(artistName);
    if (!artist) return EMPTY_RESULT;

    const today = new Date().toISOString().split('T')[0];

    // Fetch upcoming first — always, regardless of on_tour flag (unreliable)
    const upcomingResult = await this.fetchArtistEvents(artist.id);

    // Then fetch past events sequentially to avoid rate-limit collisions
    const pastRaw = await this.fetchArtistPastEvents(artist.id, today);

    // Build venue map from upcoming venues (already included in response)
    const venueMap: Record<number, any> = Object.fromEntries(
      (upcomingResult.venues ?? []).map((v: any) => [v.id, v]),
    );

    // Fetch venue info for past events whose venue isn't in the map yet
    const missingVenueIds = [
      ...new Set(
        pastRaw
          .map((e: any) => e.venue_id as number)
          .filter((id) => id && !venueMap[id]),
      ),
    ];

    if (missingVenueIds.length) {
      try {
        const venueInfos = await Promise.all(
          missingVenueIds.map((id) => this.fetchVenueInfo(id)),
        );
        missingVenueIds.forEach((id, i) => {
          if (venueInfos[i]) venueMap[id] = venueInfos[i];
        });
      } catch {
        // Venue enrichment failed — past events still returned without location
      }
    }

    const upcoming = this.normalizeEvents(upcomingResult.events ?? [], venueMap);
    const past = this.normalizeEvents(pastRaw, venueMap);

    const cities = new Set(upcoming.map((e) => e.city).filter(Boolean));
    const countries = new Set(upcoming.map((e) => e.countryCode).filter(Boolean));

    return {
      counts: {
        citiesUpcoming: cities.size,
        countriesUpcoming: countries.size,
        eventsUpcoming: upcoming.length,
      },
      upcoming,
      past,
    };
  }
}
