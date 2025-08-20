// src/articles/dto/create-article.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

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
}
