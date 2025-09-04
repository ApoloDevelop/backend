import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Obtener notificaciones del usuario
  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.sub;
    return this.notificationsService.findByUserId(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  // Obtener el número de notificaciones no leídas
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  // Marcar notificación como leída
  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  // Marcar todas las notificaciones como leídas
  @Patch('mark-all-read')
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  // Eliminar notificación
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.remove(id, userId);
  }
}
