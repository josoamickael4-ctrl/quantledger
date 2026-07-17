import { Controller, Get, Post, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private requireAdmin(role: string) {
    if (role !== 'admin') {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
  }

  @Get('stats')
  getStats(@Headers('x-member-role') role: string) {
    this.requireAdmin(role);
    return this.adminService.getGlobalStats();
  }

  @Get('member/:id/details')
  getMemberDetails(
    @Param('id') id: string,
    @Headers('x-member-role') role: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.getMemberDetails(id);
  }

  @Post('reload-data')
  reloadData(@Headers('x-member-role') role: string) {
    this.requireAdmin(role);
    return this.adminService.reloadLocalData();
  }
}
