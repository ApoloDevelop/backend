import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SongstatsService } from './songstats.service';
import { SongstatsController } from './songstats.controller';

@Module({
  imports: [ConfigModule],
  providers: [SongstatsService],
  controllers: [SongstatsController],
  exports: [SongstatsService],
})
export class SongstatsModule {}
