// favorites/dto/favorite-query.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class FavoriteQueryDto {
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @IsEnum(['artist', 'album', 'track', 'venue'] as const)
  type!: 'artist' | 'album' | 'track' | 'venue';

  // nombre del item (para artist = nombre del artista, para album/track = nombre del álbum/canción, para venue = nombre de la sala)
  @IsString()
  name!: string;

  // contexto opcional (recomendado/obligatorio según type)
  @IsOptional()
  @IsString()
  artistName?: string; // requerido para album/track

  @IsOptional()
  @IsString()
  location?: string; // para venue
}
