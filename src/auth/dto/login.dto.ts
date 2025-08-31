import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  credential: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  password: string;
}
