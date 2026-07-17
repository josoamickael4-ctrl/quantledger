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
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'trading_user',
      password: process.env.DB_PASSWORD || 'trading_password',
      database: process.env.DB_DATABASE || 'trading_journal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables (disable in production)
      logging: false,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
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

