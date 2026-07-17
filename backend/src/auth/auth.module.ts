import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [MembersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
