import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Obtener notificaciones del usuario
  @Get()
  async findAll(
    @CurrentUser('id') userId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.notificationsService.findByUserId(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  // Obtener el número de notificaciones no leídas
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  // Marcar notificación como leída
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  // Marcar todas las notificaciones como leídas
  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // Eliminar notificación
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.remove(id, userId);
  }

  // Eliminar todas las notificaciones
  @Delete()
  async removeAll(@CurrentUser('id') userId: number) {
    return this.notificationsService.removeAll(userId);
  }
}
