import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';

@Module({
  imports: [ConfigModule],
  providers: [ConcertsService],
  controllers: [ConcertsController],
})
export class ConcertsModule {}
