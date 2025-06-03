import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsDate } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsDate({ message: 'La fecha de actualización no es válida' })
  username_last_updated?: Date;
}
