import { Controller, Get, Post, Body, Param, Delete, Patch, Headers, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { Trade } from './trade.entity';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get()
  async findAll(
    @Headers('x-member-id') memberId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ): Promise<{ data: Trade[]; total: number; page: number; limit: number }> {
    return this.tradesService.findAll(memberId, parseInt(page), parseInt(limit));
  }

  @Post()
  async create(
    @Body() createTradeDto: CreateTradeDto,
  ): Promise<Trade> {
    return this.tradesService.create(createTradeDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTradeDto: UpdateTradeDto,
  ): Promise<Trade> {
    return this.tradesService.update(id, updateTradeDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.tradesService.delete(id);
  }
}
