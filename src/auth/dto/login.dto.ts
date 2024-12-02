import { Transform } from "class-transformer";
import { IsString, IsStrongPassword, MinLength } from "class-validator";

export class LoginDto {

    @IsString()
    credential: string;

    @IsStrongPassword()
    @MinLength(8)
    @Transform(({ value }) => value.trim())
    password: string;
}