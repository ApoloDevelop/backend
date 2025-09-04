import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constant';
import { GoogleStrategy } from './strategies/google.strategy';
import { SpotifyStrategy } from './strategies/spotify.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guard/optional-jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { EmailService } from '../email/email.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    GoogleStrategy,
    SpotifyStrategy,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
  ],
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
})
export class AuthModule {}
