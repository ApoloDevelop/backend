import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SpotifyModule } from './spotify/spotify.module';
import { MusicbrainzModule } from './musicbrainz/musicbrainz.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ItemModule } from './item/item.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ListsModule } from './lists/lists.module';
import { SongstatsModule } from './songstats/songstats.module';
import { GeniusModule } from './genius/genius.module';
import { GeoModule } from './geo/geo.module';
import { ArticlesModule } from './articles/articles.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CommentsModule } from './comments/comments.module';
import { ActivityModule } from './activity/activity.module';

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
    ListsModule,
    SongstatsModule,
    GeniusModule,
    GeoModule,
    ArticlesModule,
    CloudinaryModule,
    CommentsModule,
    ActivityModule,
  ],
})
export class AppModule {}
