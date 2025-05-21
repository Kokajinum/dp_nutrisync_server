import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { FoodsModule } from './foods/foods.module';
import { DiaryModule } from './diary/diary.module';
import { StepsModule } from './steps/steps.module';
import { AiRecommendationsModule } from './ai-recommendations/ai-recommendations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OpenAiModule } from './openai/openai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    SupabaseModule,
    UsersModule,
    FoodsModule,
    DiaryModule,
    StepsModule,
    AiRecommendationsModule,
    DashboardModule,
    OpenAiModule,
    NotificationsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
