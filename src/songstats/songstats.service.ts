import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  private normalize(json: any) {
    const audioAnalysis = json?.audio_analysis ?? [];
    const info = json?.track_info ?? json?.object_info ?? {};

    // --- BPM / Key / Duration (igual que ya tenías) ---
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
    let genres: string[] = [];
    if (Array.isArray(info?.genres)) genres = info.genres;
    else if (typeof info?.genre === 'string') genres = [info.genre];

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

  async getTrackInfo(spotifyId: string) {
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
      ...this.normalize(json),
    };
  }
}
