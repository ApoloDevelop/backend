import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class RateDto {
  @IsEnum(['artist', 'album', 'track', 'venue'] as const)
  type!: 'artist' | 'album' | 'track' | 'venue';

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  score!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artistName?: string; // REQUERIDO para album/track

  @IsOptional()
  @IsString()
  albumName?: string; // REQUERIDO para track

  @IsOptional()
  @IsString()
  location?: string; // opcional para venue
}
