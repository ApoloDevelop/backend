import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, NotificationsModule],
  exports: [UsersService],
})
export class UsersModule {}
