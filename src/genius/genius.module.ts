import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeniusService } from './genius.service';
import { GeniusController } from './genius.controller';

@Module({
  imports: [ConfigModule],
  providers: [GeniusService],
  controllers: [GeniusController],
  exports: [GeniusService],
})
export class GeniusModule {}
