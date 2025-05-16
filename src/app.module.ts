import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryController } from './cloudinary/cloudinary.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Module({
  imports: [UsersModule, AuthModule, ConfigModule.forRoot()],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
})
export class AppModule {}
