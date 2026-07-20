import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradesModule } from './trades/trades.module';
import { ConseilsModule } from './conseils/conseils.module';
import { StrategiesModule } from './strategies/strategies.module';
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables (disable in production)
      logging: false,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      extra: {
        ssl: process.env.DATABASE_URL ? {
          rejectUnauthorized: false
        } : undefined
      }
    }),
    TradesModule,
    ConseilsModule,
    StrategiesModule,
    MembersModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}

