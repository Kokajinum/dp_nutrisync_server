import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { FoodsModule } from './foods/foods.module';
import { DiaryModule } from './diary/diary.module';
import { StepsModule } from './steps/steps.module';
import { AiRecommendationsModule } from './ai-recommendations/ai-recommendations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SupabaseModule,
    UsersModule,
    FoodsModule,
    DiaryModule,
    StepsModule,
    AiRecommendationsModule,
    DashboardModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
