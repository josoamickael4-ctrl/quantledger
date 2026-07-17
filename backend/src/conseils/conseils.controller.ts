import { Controller, Get, Post, Body, Param, Delete, Patch, Headers, Query } from '@nestjs/common';
import { ConseilsService } from './conseils.service';
import { CreateConseilDto } from './dto/create-conseil.dto';
import { UpdateConseilDto } from './dto/update-conseil.dto';
import { Conseil } from './conseil.entity';

@Controller('conseils')
export class ConseilsController {
  constructor(private readonly conseilsService: ConseilsService) {}

  @Get()
  async findAll(
    @Headers('x-member-id') memberId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ): Promise<{ data: Conseil[]; total: number; page: number; limit: number }> {
    return this.conseilsService.findAll(memberId, parseInt(page), parseInt(limit));
  }

  @Post()
  async create(
    @Body() createConseilDto: CreateConseilDto,
  ): Promise<Conseil> {
    return this.conseilsService.create(createConseilDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateConseilDto: UpdateConseilDto,
  ): Promise<Conseil> {
    return this.conseilsService.update(id, updateConseilDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.conseilsService.delete(id);
  }
}
