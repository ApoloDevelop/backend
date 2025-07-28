import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FavoriteQueryDto {
  @IsString()
  artistName: string;

  @Type(() => Number)
  @IsInt()
  userId: number;
}
