import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCommentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;
}
