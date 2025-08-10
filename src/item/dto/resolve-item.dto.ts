// item/dto/resolve-item.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ResolveItemDto {
  @IsEnum(['artist', 'album', 'track', 'venue', 'genre'] as const)
  type!: 'artist' | 'album' | 'track' | 'venue' | 'genre';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  artistName?: string; // req. para album/track

  @IsOptional()
  @IsString()
  location?: string; // opcional para venue
}
