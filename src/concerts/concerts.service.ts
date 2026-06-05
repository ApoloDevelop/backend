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

  private async searchArtistId(
    artistName: string,
  ): Promise<{ id: number; on_tour: boolean } | null> {
    const url = new URL(`https://${this.rapidApiHost}/search`);
    url.searchParams.set('keyword', artistName);
    url.searchParams.set('types', 'artist');

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers(),
      });
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
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers(),
      });
      if (!res.ok) return { events: [], venues: [] };
      return await res.json();
    } catch {
      return { events: [], venues: [] };
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
    const artist = await this.searchArtistId(artistName);
    if (!artist) return EMPTY_RESULT;
    if (!artist.on_tour) return EMPTY_RESULT;

    const { events, venues } = await this.fetchArtistEvents(artist.id);
    const venueMap: Record<number, any> = Object.fromEntries(
      (venues ?? []).map((v: any) => [v.id, v]),
    );
    const upcoming = this.normalizeEvents(events ?? [], venueMap);

    const cities = new Set(upcoming.map((e) => e.city).filter(Boolean));
    const countries = new Set(upcoming.map((e) => e.countryCode).filter(Boolean));

    return {
      counts: {
        citiesUpcoming: cities.size,
        countriesUpcoming: countries.size,
        eventsUpcoming: upcoming.length,
      },
      upcoming,
      past: [],
    };
  }
}
