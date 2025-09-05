import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SongstatsTrackInfo {
  bpm: number | null;
  key: string | null;
  genres: string[];
  collaborators: { name: string; roles: string[] }[];
  label: string | null;
  distributor: string | null;
}

export interface SongstatsRelatedArtist {
  id: string | null;
  name: string | null;
  avatar: string | null;
}

export interface SongstatsArtistLink {
  source: string;
  external_id: string;
  url: string;
}

export interface SongstatsArtistInfo {
  bio: string | null;
  genres: string[];
  related_artists: SongstatsRelatedArtist[];
  links: SongstatsArtistLink[];
}

export interface SongstatsEvent {
  title: string | null;
  date: string | null; // YYYY-MM-DD
  link: string | null;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
}

export interface SongstatsArtistEventInfo {
  counts: {
    citiesUpcoming: number;
    countriesUpcoming: number;
    eventsUpcoming: number;
  };
  upcoming: SongstatsEvent[];
  past: SongstatsEvent[];
}

@Injectable()
export class SongstatsService {
  private rapidApiKey: string;
  private rapidApiHost: string;

  constructor(private configService: ConfigService) {
    this.rapidApiKey = this.configService.get('RAPIDAPI_KEY');
    this.rapidApiHost = this.configService.get('RAPIDAPI_SONGSTATS_HOST');
  }

  private headers() {
    return {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
    };
  }

  //--------TRACK------------

  private normalizeTrack(json: any): SongstatsTrackInfo {
    const audioAnalysis = json?.audio_analysis ?? [];
    const info = json?.track_info ?? json?.object_info ?? {};

    // --- BPM / Key / Duration ---
    const tempo = Array.isArray(audioAnalysis)
      ? audioAnalysis.find((x: any) => String(x?.key).toLowerCase() === 'tempo')
          ?.value
      : null;
    const mode = Array.isArray(audioAnalysis)
      ? audioAnalysis.find((x: any) => String(x?.key).toLowerCase() === 'mode')
          ?.value
      : null;
    const baseKey = Array.isArray(audioAnalysis)
      ? audioAnalysis.find((x: any) => String(x?.key).toLowerCase() === 'key')
          ?.value
      : null;

    const bpm = tempo != null ? Math.round(parseFloat(String(tempo))) : null;
    const isMinor = mode != null ? Number(mode) === 0 : null;
    const musicalKey = baseKey
      ? `${baseKey}${isMinor ? 'm' : ''}`
      : (info?.key ?? null);

    // ---Géneros---
    const genres = Array.isArray(info?.genres) ? info.genres.slice(0, 3) : [];

    // ---Colaboradores---
    let collaborators = (info?.collaborators ?? []) as any[];
    if (!Array.isArray(collaborators)) collaborators = [];
    collaborators = collaborators.map((c: any) => ({
      name: c?.name ?? c?.artist_name ?? '',
      roles: Array.isArray(c?.roles)
        ? c.roles.map((r: any) => String(r))
        : c?.role
          ? [String(c.role)]
          : [],
    }));

    // ---Discográficas---
    const labelsArr = info?.labels ?? [];
    const distributorsArr = info?.distributors ?? [];

    const label =
      Array.isArray(labelsArr) && labelsArr.length
        ? (labelsArr[0]?.name ?? null)
        : null;

    const distributor =
      Array.isArray(distributorsArr) && distributorsArr.length
        ? typeof distributorsArr[0] === 'string'
          ? distributorsArr[0]
          : (distributorsArr[0]?.name ?? null)
        : null;

    return {
      bpm,
      key: musicalKey ?? null,
      genres,
      collaborators,
      label,
      distributor,
    };
  }

  async getTrackInfo(spotifyId: string): Promise<SongstatsTrackInfo> {
    if (!spotifyId) {
      throw new BadRequestException('spotifyId is required');
    }
    const url = new URL(`https://${this.rapidApiHost}/tracks/info`);
    url.searchParams.set('spotify_track_id', spotifyId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        'Error fetching track info: ',
        res.status,
        res.statusText,
        body,
      );
      throw new InternalServerErrorException('Failed to fetch track info');
    }
    const json = await res.json();

    return {
      ...this.normalizeTrack(json),
    };
  }

  //--------ARTIST------------

  private normalizeArtist(json: any): SongstatsArtistInfo {
    const artistInfo = json?.artist_info ?? {};

    const bio =
      typeof artistInfo?.bio === 'string' && artistInfo.bio.trim().length
        ? artistInfo.bio
        : null;

    const genres = Array.isArray(artistInfo?.genres)
      ? artistInfo.genres.slice(0, 3)
      : [];

    const relatedRaw = Array.isArray(artistInfo?.related_artists)
      ? artistInfo.related_artists
      : [];

    const related_artists: SongstatsRelatedArtist[] = relatedRaw.map(
      (a: any) => ({
        id: a?.songstats_artist_id ?? null,
        name: a?.name ?? null,
        avatar: a?.avatar ?? null,
      }),
    );

    const linksRaw = Array.isArray(artistInfo?.links) ? artistInfo.links : [];

    const links: SongstatsArtistLink[] = linksRaw.map((link: any) => ({
      source: link?.source ?? '',
      external_id: link?.external_id ?? '',
      url: link?.url ?? '',
    }));

    return { bio, genres, related_artists, links };
  }

  async getArtistInfo(spotifyArtistId: string): Promise<SongstatsArtistInfo> {
    if (!spotifyArtistId) {
      throw new BadRequestException('spotifyArtistId is required');
    }

    const url = new URL(`https://${this.rapidApiHost}/artists/info`);
    url.searchParams.set('spotify_artist_id', spotifyArtistId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        'Error fetching artist info: ',
        res.status,
        res.statusText,
        body,
      );
      throw new InternalServerErrorException('Failed to fetch artist info');
    }

    const json = await res.json();
    return this.normalizeArtist(json);
  }

  //------------EVENTS------------

  private toNumber(n: any): number | null {
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
  }

  private normalizeArtistEvents(json: any): SongstatsArtistEventInfo {
    const e = json?.events ?? {};

    const counts = {
      citiesUpcoming: this.toNumber(e?.cities_upcoming) ?? 0,
      countriesUpcoming: this.toNumber(e?.countries_upcoming) ?? 0,
      eventsUpcoming: this.toNumber(e?.events_upcoming) ?? 0,
    };

    const mapEvent = (ev: any): SongstatsEvent => ({
      title: ev?.event_title ?? null,
      date: ev?.event_date ?? null, // YYYY-MM-DD
      link: ev?.event_link ?? null,
      city: ev?.city_name ?? null,
      region: ev?.city_region ?? null,
      countryCode: ev?.country_code ?? null,
      lat: this.toNumber(ev?.lat),
      lng: this.toNumber(ev?.lng),
    });

    const upcoming: SongstatsEvent[] = Array.isArray(e?.upcoming_events)
      ? e.upcoming_events.map(mapEvent)
      : [];

    const past: SongstatsEvent[] = Array.isArray(e?.past_events)
      ? e.past_events.map(mapEvent)
      : [];

    return { counts, upcoming, past };
  }

  async getArtistEventInfo(
    spotifyArtistId: string,
  ): Promise<SongstatsArtistEventInfo> {
    if (!spotifyArtistId)
      throw new BadRequestException('spotifyArtistId is required');

    const url = new URL(`https://${this.rapidApiHost}/artists/events`);
    url.searchParams.set('spotify_artist_id', spotifyArtistId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        'Error fetching artist events: ',
        res.status,
        res.statusText,
        body,
      );
      throw new InternalServerErrorException('Failed to fetch artist events');
    }

    const json = await res.json();
    return this.normalizeArtistEvents(json);
  }
}
