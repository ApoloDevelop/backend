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
import e from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //--------------REGISTER-------------------
  async register(registerDto: RegisterDto) {
    const { email, username, phone } = registerDto;

    //Verify if the email already exists
    const userByEmail = await this.usersService.findUserByEmail(email);
    if (userByEmail) {
      throw new BadRequestException('This email already exists');
    }

    //Verify if the username already exists
    const userByUsername = await this.usersService.findUserByUsername(username);
    if (userByUsername) {
      throw new BadRequestException('This username already exists');
    }

    //Verify if the phone already exists
    const userByPhone = await this.usersService.findUserByPhone(phone);
    if (userByPhone) {
      throw new BadRequestException('This phone already exists');
    }

    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);

    //Create user
    const user = await this.usersService.createUser({
      ...registerDto,
      password: hashedPassword,
      role_id: registerDto.role_id ?? 5,
    });

    //Generate JWT token
    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload);

    return { token, ...user };
  }

  //-----------LOGIN-------------------
  async login(loginDto: LoginDto) {
    //Check if the user exists by email or username
    const user =
      (await this.usersService.findUserByEmail(loginDto.credential)) ||
      (await this.usersService.findUserByUsername(loginDto.credential));

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

  //-----------OAUTH-------------------
  async oauthLogin(oauthUser: any): Promise<{ user: any; token: string }> {
    const { email, username, ...rest } = oauthUser;
    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
      user = await this.usersService.createUser({
        fullname:
          `${oauthUser.firstName || ''} ${oauthUser.lastName || ''}`.trim(),
        email: oauthUser.email,
        username: oauthUser.username || oauthUser.email.split('@')[0],
        password: null,
        profile_pic: oauthUser.picture,
        role_id: 5,
        birthdate: new Date(),
      });
    }

    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
    });
    return { user, token };
  }
}
