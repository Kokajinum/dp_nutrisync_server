import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiModule } from '../openai/openai.module';
import { SupabaseClientFactory } from './supabase-client.factory';
import { BaseSupabaseService } from './base-supabase.service';
import { UsersSupabaseService } from './users-supabase.service';
import { FoodsSupabaseService } from './foods-supabase.service';
import { DiarySupabaseService } from './diary-supabase.service';
import { StepsSupabaseService } from './steps-supabase.service';
import { AiRecommendationsSupabaseService } from './ai-recommendations-supabase.service';
import { PushTokensSupabaseService } from './push-tokens-supabase.service';
import { NotificationsSupabaseService } from './notifications-supabase.service';
import { RecommendationAgentSupabaseService } from './recommendation-agent-supabase.service';

@Module({
  imports: [ConfigModule, OpenAiModule],
  providers: [
    SupabaseClientFactory,
    BaseSupabaseService,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
    StepsSupabaseService,
    AiRecommendationsSupabaseService,
    PushTokensSupabaseService,
    NotificationsSupabaseService,
    RecommendationAgentSupabaseService,
  ],
  exports: [
    SupabaseClientFactory,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
    StepsSupabaseService,
    AiRecommendationsSupabaseService,
    PushTokensSupabaseService,
    NotificationsSupabaseService,
    RecommendationAgentSupabaseService,
  ],
})
export class SupabaseModule {}
