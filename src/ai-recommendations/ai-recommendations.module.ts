import { Module } from '@nestjs/common';
import { AiRecommendationsController } from './ai-recommendations.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AiRecommendationsController],
})
export class AiRecommendationsModule {}
