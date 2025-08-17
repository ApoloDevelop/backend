import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsLowercase,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserGenre } from 'src/auth/dto/register.dto';

export class CreateUserDto {
  @IsString()
  @MinLength(2, {
    message: 'El nombre completo debe tener al menos 2 caracteres',
  })
  fullname: string;

  @MinLength(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres',
  })
  @IsString()
  @IsLowercase({ message: 'El nombre de usuario debe estar en minúsculas' })
  @MaxLength(30, {
    message: 'El nombre de usuario no puede tener más de 30 caracteres',
  })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre de usuario no puede contener caracteres especiales',
  })
  @Transform(({ value }) => value.trim())
  username: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'El correo electrónico no tiene un formato válido',
  })
  email: string;

  @IsStrongPassword(
    {},
    {
      message:
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    },
  )
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Transform(({ value }) => value.trim())
  password: string;

  @IsDate({ message: 'La fecha de nacimiento no es válida' })
  @Type(() => Date)
  birthdate: Date;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(UserGenre, { message: 'El género no es válido' })
  @IsOptional()
  social_genre?: UserGenre;

  @IsUrl()
  @IsOptional()
  spotify_link?: string;

  @IsUrl()
  @IsOptional()
  youtube_link?: string;

  @IsUrl()
  @IsOptional()
  twitter_link?: string;

  @IsUrl()
  @IsOptional()
  instagram_link?: string;

  @IsUrl()
  @IsOptional()
  external_url?: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsUrl()
  @IsOptional()
  profile_pic?: string;

  @IsUrl()
  @IsOptional()
  cover_pic?: string;

  @IsOptional()
  role_id?: number;
}
