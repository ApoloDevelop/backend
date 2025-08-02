import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ListsService } from './lists.service';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  async getUserLists(
    @Query('userId') userId: number,
    @Query('itemType') itemType?: string,
  ) {
    return this.listsService.getListsByUserId(userId, itemType);
  }

  @Post()
  async createList(
    @Body()
    dto: {
      userId: number;
      name: string;
      itemType?: string;
    },
  ) {
    return this.listsService.createList(dto);
  }

  @Post('add-item')
  async addItemToList(@Body() dto: { listId: number; itemId: number }) {
    return this.listsService.addItemToList(dto);
  }

  @Delete('remove-item')
  async removeItemFromList(@Body() dto: { listId: number; itemId: number }) {
    return this.listsService.removeItemFromList(dto);
  }
}
