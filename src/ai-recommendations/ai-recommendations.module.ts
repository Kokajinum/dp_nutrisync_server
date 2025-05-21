import { Module } from '@nestjs/common';
import { AiRecommendationsController } from './ai-recommendations.controller';
import { TestAiRecommendationsController } from './test-ai-recommendations.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { OpenAiModule } from '../openai/openai.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SupabaseModule, OpenAiModule, NotificationsModule],
  controllers: [AiRecommendationsController, TestAiRecommendationsController],
  providers: [],
})
export class AiRecommendationsModule {}
