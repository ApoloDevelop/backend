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
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser<T extends { password?: any }>(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = user as any;
    return safe;
  }

  //--------------REGISTER-------------------
  async register(registerDto: RegisterDto) {
    const { email, username } = registerDto;

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

    return { token, user: this.sanitizeUser(user) };
  }

  //-----------LOGIN-------------------
  async login(loginDto: LoginDto) {
    //Check if the user exists by email or username
    const user =
      (await this.usersService.findUserByEmail(loginDto.credential)) ||
      (await this.usersService.findUserByUsername(loginDto.credential));

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    //Check if the password is correct
    const isPasswordValid = await bcryptjs.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    //Generate JWT token
    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload);

    //Return the token and user data
    return { token, user: this.sanitizeUser(user) };
  }

  //-----------OAUTH-------------------
  async oauthLogin(oauthUser: any): Promise<{ user: any; token: string }> {
    const email = oauthUser.email ?? null;
    const firstName = oauthUser.firstName ?? oauthUser.displayName ?? '';
    const lastName = oauthUser.lastName ?? '';
    const picture = oauthUser.picture ?? oauthUser.photos ?? null;
    const suggestedUsername =
      oauthUser.username ?? (email ? email.split('@')[0] : oauthUser.id);

    if (!email) {
      // Si el proveedor no nos da email, decide: o bien bloqueas y pides email, o creas un "pending" flow
      throw new UnauthorizedException('Email not provided by provider');
    }

    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
      user = await this.usersService.createUser({
        fullname: `${firstName} ${lastName}`.trim(),
        email,
        username: suggestedUsername,
        password: null,
        profile_pic: picture,
        role_id: 5,
        birthdate: new Date(), // o null si no es requerido
      });
    }

    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '1d' });
    return { user: this.sanitizeUser(user), token };
  }
}
