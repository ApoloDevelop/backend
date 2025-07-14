import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryController } from './cloudinary/cloudinary.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { SpotifyModule } from './spotify/spotify.module';
import { MusicbrainzModule } from './musicbrainz/musicbrainz.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot(),
    SpotifyModule,
    PrismaModule,
    MusicbrainzModule,
  ],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
})
export class AppModule {}
