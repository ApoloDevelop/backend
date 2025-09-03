import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller()
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  // Crear post (auth requerida)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post('activity')
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: any) {
    return this.activity.create(Number(user.id), dto);
  }

  // Listar posts de un usuario (público)
  @Get('users/:id/activity')
  listByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query('skip') skip = '0',
    @Query('take') take = '10',
  ) {
    return this.activity.listByUser(
      userId,
      Number(skip) || 0,
      Math.min(50, Math.max(1, Number(take) || 10)),
    );
  }

  // Borrar post (owner o admin/mod)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Delete('activity/:id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.activity.removeByPolicy(id, {
      id: Number(user.id),
      role_id: Number(user.role_id),
    });
  }
}
