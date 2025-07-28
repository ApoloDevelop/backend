import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemService } from 'src/item/item.service';

@Module({
  imports: [PrismaModule],
  providers: [FavoritesService, ItemService],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
