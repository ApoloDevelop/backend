import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';

import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly UsersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //--------------REGISTER-------------------
  async register(registerDto: RegisterDto) {
    const { email, username, phone } = registerDto;

    //Verify if the email already exists
    const userByEmail = await this.UsersService.findUserByEmail(email);
    if (userByEmail) {
      throw new BadRequestException('This email already exists');
    }

    //Verify if the username already exists
    const userByUsername = await this.UsersService.findUserByUsername(username);
    if (userByUsername) {
      throw new BadRequestException('This username already exists');
    }

    //Verify if the phone already exists
    const userByPhone = await this.UsersService.findUserByPhone(phone);
    if (userByPhone) {
      throw new BadRequestException('This phone already exists');
    }

    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);

    //Create user
    const user = await this.UsersService.createUser({
      ...registerDto,
      password: hashedPassword,
      role_id: registerDto.role_id ?? 5,
    });

    //Generate JWT token
    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload);

    return { token, user };
  }

  //-----------LOGIN-------------------
  async login(loginDto: LoginDto) {
    //Check if the user exists by email or username
    const user =
      (await this.UsersService.findUserByEmail(loginDto.credential)) ||
      (await this.UsersService.findUserByUsername(loginDto.credential));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //Check if the password is correct
    const isPasswordValid = await bcryptjs.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //Generate JWT token
    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload);

    //Return the token and user data
    return { token, user };
  }
}
