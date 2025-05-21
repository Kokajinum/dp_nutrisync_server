import { Module } from '@nestjs/common';
import { AiRecommendationsController } from './ai-recommendations.controller';
import { RecommendationAgentService } from './recommendation-agent.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { OpenAiModule } from '../openai/openai.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SupabaseModule, OpenAiModule, NotificationsModule],
  controllers: [AiRecommendationsController],
  providers: [RecommendationAgentService],
})
export class AiRecommendationsModule {}
