import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TradesModule } from '../trades/trades.module';
import { ConseilsModule } from '../conseils/conseils.module';
import { StrategiesModule } from '../strategies/strategies.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [TradesModule, ConseilsModule, StrategiesModule, MembersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
