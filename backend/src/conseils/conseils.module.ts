import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConseilsController } from './conseils.controller';
import { ConseilsService } from './conseils.service';
import { Conseil } from './conseil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conseil])],
  controllers: [ConseilsController],
  providers: [ConseilsService],
  exports: [ConseilsService],
})
export class ConseilsModule {}
