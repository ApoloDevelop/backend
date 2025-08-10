import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
  Post,
  Body,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { ResolveItemDto } from './dto/resolve-item.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get('find')
  async findItem(@Query() q: ResolveItemDto) {
    console.log('Resolviendo item:', q);
    const result = await this.itemService.ensureItemByTypeAndName(
      q.type,
      q.name,
      { artistName: q.artistName, location: q.location },
    );
    if (!result) throw new NotFoundException('Item no encontrado');
    return result; // { itemId }
  }
}
