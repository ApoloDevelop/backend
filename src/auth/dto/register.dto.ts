import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  IsUrl,
  MinLength,
} from 'class-validator';

export enum UserGenre {
  Male = 'male',
  Female = 'female',
  NonBinary = 'non_binary',
  Other = 'other',
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  fullname: string;

  @MinLength(3)
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  @MinLength(8)
  @Transform(({ value }) => value.trim())
  password: string;

  @IsDate()
  @Type(() => Date)
  birthdate: Date;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  spotify_link?: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsUrl()
  @IsOptional()
  profile_pic?: string;

  @IsUrl()
  @IsOptional()
  cover_pic?: string;

  @IsEnum(UserGenre)
  @IsOptional()
  social_genre?: UserGenre;

  @IsOptional()
  role_id?: number;
}
