import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ItemService } from 'src/item/item.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, ItemService],
  imports: [PrismaModule],
  exports: [ReviewsService],
})
export class ReviewsModule {}
