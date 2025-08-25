import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id!: number; // TEMPORAL: hasta tener guard

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parent_id?: number;
}
