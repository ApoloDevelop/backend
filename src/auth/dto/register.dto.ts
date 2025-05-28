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
  @MinLength(3, {
    message: 'El nombre completo debe tener al menos 3 caracteres',
  })
  fullname: string;

  @MinLength(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres',
  })
  @IsString()
  username: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
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

  @IsEnum(UserGenre, { message: 'El género no es válido' })
  @IsOptional()
  social_genre?: UserGenre;

  @IsOptional()
  role_id?: number;
}
