import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Headers, UnauthorizedException, Query,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  private requireAdmin(role: string) {
    if (role !== 'admin') {
      throw new UnauthorizedException('Accès réservé à l\'administrateur.');
    }
  }

  @Get()
  async findAll(
    @Headers('x-member-role') role: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    this.requireAdmin(role);
    return this.membersService.findAll(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.membersService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreateMemberDto,
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.membersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.membersService.update(id, dto);
  }

  @Patch(':id/regenerate-code')
  async regenerateCode(
    @Param('id') id: string,
    @Body() body: { code?: string },
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.membersService.regenerateCode(id, body?.code);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.membersService.delete(id);
  }
}
