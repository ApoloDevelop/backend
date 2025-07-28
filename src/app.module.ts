import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryController } from './cloudinary/cloudinary.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { SpotifyModule } from './spotify/spotify.module';
import { MusicbrainzModule } from './musicbrainz/musicbrainz.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ItemModule } from './item/item.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot(),
    SpotifyModule,
    PrismaModule,
    MusicbrainzModule,
    ReviewsModule,
    ItemModule,
    FavoritesModule,
  ],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
})
export class AppModule {}
