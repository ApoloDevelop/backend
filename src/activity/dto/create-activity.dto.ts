import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateActivityDto {
  @IsIn(['artist', 'album', 'track'])
  itemType!: 'artist' | 'album' | 'track';

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  artistName?: string;

  @IsOptional()
  @IsString()
  albumName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}
