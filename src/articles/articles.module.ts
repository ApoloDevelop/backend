import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ItemService } from 'src/item/item.service';

@Module({
  imports: [PrismaModule],
  providers: [ArticlesService, ItemService],
  controllers: [ArticlesController],
  exports: [ArticlesService],
})
export class ArticlesModule {}
