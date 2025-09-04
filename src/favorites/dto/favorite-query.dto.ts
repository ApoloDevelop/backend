import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class FavoriteQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEnum(['artist', 'album', 'track', 'venue'] as const)
  type!: 'artist' | 'album' | 'track' | 'venue';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  artistName?: string; // requerido para album/track

  @IsOptional()
  @IsString()
  location?: string; // para venue
}
