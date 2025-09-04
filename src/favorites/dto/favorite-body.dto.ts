import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class FavoriteBodyDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEnum(['artist', 'album', 'track', 'venue'] as const)
  type!: 'artist' | 'album' | 'track' | 'venue';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  artistName?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
