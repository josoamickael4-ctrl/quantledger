import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('access')
  @HttpCode(HttpStatus.OK)
  async access(@Body() body: { code: string }) {
    return this.authService.authenticate(body.code);
  }
}
