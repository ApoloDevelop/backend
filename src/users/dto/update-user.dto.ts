import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsDate({ message: 'La fecha de actualización no es válida' })
  @Type(() => Date)
  username_last_update?: Date;
}
