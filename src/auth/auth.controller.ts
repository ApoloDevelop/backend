import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() user: any) {
    return user;
  }

  //Google Auth route
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {}

  //Google Auth callback route
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { token } = await this.authService.oauthLogin(req.user);
    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${token}`,
    );
  }

  //Spotify Auth route
  @Get('spotify')
  @UseGuards(PassportAuthGuard('spotify'))
  async spotifyAuth() {}

  //Spotify Auth callback route
  @Get('spotify/callback')
  @UseGuards(PassportAuthGuard('spotify'))
  async spotifyCallback(@Req() req: Request, @Res() res: Response) {
    const { token } = await this.authService.oauthLogin(req.user);
    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${token}`,
    );
  }

  //Forgot Password route
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  //Reset Password route
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
