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
import { AuthGuard } from './guard/auth.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { password, ...userWithoutPassword } =
      await this.authService.register(registerDto);
    return userWithoutPassword;
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  profile(@Req() req) {
    return req.user;
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

  //LastFM Auth route
  @Get('lastfm')
  @UseGuards(PassportAuthGuard('lastfm'))
  async lastfmAuth() {}

  //LastFM Auth callback route
  @Get('lastfm/callback')
  @UseGuards(PassportAuthGuard('lastfm'))
  async lastfmCallback(@Req() req: Request, @Res() res: Response) {
    const { token } = await this.authService.oauthLogin(req.user);
    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${token}`,
    );
  }
}
