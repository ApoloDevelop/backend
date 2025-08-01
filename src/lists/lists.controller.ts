import { Controller, Get, Query } from '@nestjs/common';
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
}
