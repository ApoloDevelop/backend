import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ItemService } from 'src/item/item.service';

@Module({
  imports: [PrismaModule],
  providers: [ActivityService, ItemService],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}
