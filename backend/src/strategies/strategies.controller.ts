import { Controller, Get, Post, Body, Param, Delete, Patch, Headers, Query } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { Strategy } from './strategy.entity';

@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get()
  async findAll(
    @Headers('x-member-id') memberId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ): Promise<{ data: Strategy[]; total: number; page: number; limit: number }> {
    return this.strategiesService.findAll(memberId, parseInt(page), parseInt(limit));
  }

  @Post()
  async create(
    @Body() createStrategyDto: CreateStrategyDto,
  ): Promise<Strategy> {
    return this.strategiesService.create(createStrategyDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ): Promise<Strategy> {
    return this.strategiesService.update(id, updateStrategyDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.strategiesService.delete(id);
  }
}
