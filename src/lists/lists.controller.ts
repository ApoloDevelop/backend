import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Get()
  async getUserLists(
    @Query('itemType') itemType: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.listsService.getListsByUserId(Number(user.id), itemType);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post()
  async createList(
    @Body() dto: { name: string; itemType?: string },
    @CurrentUser() user: any,
  ) {
    return this.listsService.createList({
      userId: Number(user.id),
      name: dto.name,
      itemType: dto.itemType,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Post('add-item')
  async addItemToList(
    @Body() dto: { listId: number; itemId: number },
    @CurrentUser() user: any,
  ) {
    return this.listsService.addItemToList({
      userId: Number(user.id),
      listId: Number(dto.listId),
      itemId: Number(dto.itemId),
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5)
  @Delete('remove-item')
  @HttpCode(204)
  async removeItemFromList(
    @Body() dto: { listId: number; itemId: number },
    @CurrentUser() user: any,
  ) {
    await this.listsService.removeItemFromList({
      userId: Number(user.id),
      listId: Number(dto.listId),
      itemId: Number(dto.itemId),
    });
  }
}
