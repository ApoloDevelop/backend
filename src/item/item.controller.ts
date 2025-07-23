import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ItemService } from './item.service';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get('find')
  async findItem(
    @Query('type') type: string,
    @Query('name') name: string,
  ): Promise<{ itemId: number }> {
    if (!type || !name) {
      throw new BadRequestException(
        'Los parámetros "type" y "name" son obligatorios',
      );
    }

    return this.itemService.findItemByTypeAndName(type, name);
  }
}
