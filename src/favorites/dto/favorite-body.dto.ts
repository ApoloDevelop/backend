import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FavoriteBodyDto {
  @IsString()
  artistName: string;

  @Type(() => Number)
  @IsInt()
  user: number;
}
