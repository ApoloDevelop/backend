import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';

import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        private readonly UsersService: UsersService,
        private readonly jwtService: JwtService
    ){}

    async register(registerDto: RegisterDto){

        const { email, username, phone } = registerDto;

        //Verificar si el email ya existe
        const userByEmail = await this.UsersService.findUserByEmail(registerDto.email);
        if(userByEmail){
            throw new BadRequestException('This email already exists');
        }

        //Verificar si el username ya existe
        const userByUsername = await this.UsersService.findUserByUsername(registerDto.username);
        if(userByUsername){
            throw new BadRequestException('This username already exists');
        }

        //Verificar si el phone ya existe
        const userByPhone = await this.UsersService.findUserByPhone(registerDto.phone);
        if(userByPhone){
            throw new BadRequestException('This phone already exists');
        }

        const hashedPassword = await bcryptjs.hash(registerDto.password, 10);

        return await this.UsersService.createUser({
            ...registerDto,
            password: hashedPassword,
        });
    }

    async login(loginDto: LoginDto){
        const userByEmail = await this.UsersService.findUserByEmail(loginDto.credential);
        if(!userByEmail){
            const userByUsername = await this.UsersService.findUserByUsername(loginDto.credential);
            if(!userByUsername){
                throw new UnauthorizedException('Email or username is wrong');
            }else{
                const IsStrongPasswordValid = await bcryptjs.compare(loginDto.password, userByUsername.password);
                if(!IsStrongPasswordValid){
                    throw new UnauthorizedException('Password is wrong');
                }
                const payload = { username: userByUsername.username };
                const token = await this.jwtService.signAsync(payload);
                return {
                    token,
                    user: userByUsername
                }
            }
        }else{
            const IsStrongPasswordValid = await bcryptjs.compare(loginDto.password, userByEmail.password);
            if(!IsStrongPasswordValid){
                throw new UnauthorizedException('Password is wrong');
            }
            const payload = { email: userByEmail.email };
            const token = await this.jwtService.signAsync(payload);
            return {
                token,
                user: userByEmail
            }
        }
    }
}
