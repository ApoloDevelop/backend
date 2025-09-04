import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
        birthdate: new Date(),
      });
    }

    const payload = { sub: user.id, role: user.role_id };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '1d' });
    return { user: this.sanitizeUser(user), token };
  }

  //-----------FORGOT PASSWORD-------------------
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Buscar usuario por email
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('No existe una cuenta con ese email');
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora desde ahora

    // Guardar token en la base de datos
    await this.usersService.updateUser(user.id, {
      reset_password_token: resetToken,
      reset_password_expires: resetTokenExpires,
    });

    // Enviar email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Se ha enviado un email de recuperación a tu correo' };
  }

  //-----------RESET PASSWORD-------------------
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Buscar usuario por token
    const user = await this.usersService.findUserByResetToken(token);
    if (!user) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    // Verificar que el token no haya expirado
    if (user.reset_password_expires < new Date()) {
      throw new BadRequestException('El token de recuperación ha expirado');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Actualizar contraseña y limpiar tokens de reset
    await this.usersService.updateUser(user.id, {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
