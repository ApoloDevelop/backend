import { Module } from '@nestjs/common';
import { MusicbrainzService } from './musicbrainz.service';
import { MusicbrainzController } from './musicbrainz.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [MusicbrainzService],
  controllers: [MusicbrainzController],
  exports: [MusicbrainzService],
})
export class MusicbrainzModule {}
