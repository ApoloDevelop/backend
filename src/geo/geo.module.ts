import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';

@Module({
  imports: [ConfigModule],
  providers: [GeoService],
  controllers: [GeoController],
  exports: [GeoService],
})
export class GeoModule {}
