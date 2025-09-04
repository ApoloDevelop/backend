import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token es obligatorio' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsStrongPassword(
    {},
    {
      message: ' una mayúscula, una minúscula, un número y un símbolo',
    },
  )
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
