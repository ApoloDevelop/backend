// src/articles/dto/create-article.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class TagInputDto {
  @IsIn(['artist', 'album', 'track'])
  type: 'artist' | 'album' | 'track';

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  artistName?: string; // requerido para album/track en tu ItemService

  @IsOptional()
  @IsString()
  albumName?: string; // requerido para track en tu ItemService
}

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @Min(1)
  author_id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagInputDto)
  tags?: TagInputDto[];
}
