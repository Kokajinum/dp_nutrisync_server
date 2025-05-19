import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClientFactory } from './supabase-client.factory';
import { BaseSupabaseService } from './base-supabase.service';
import { UsersSupabaseService } from './users-supabase.service';
import { FoodsSupabaseService } from './foods-supabase.service';
import { DiarySupabaseService } from './diary-supabase.service';
import { StepsSupabaseService } from './steps-supabase.service';
import { AiRecommendationsSupabaseService } from './ai-recommendations-supabase.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SupabaseClientFactory,
    BaseSupabaseService,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
    StepsSupabaseService,
    AiRecommendationsSupabaseService,
  ],
  exports: [
    SupabaseClientFactory,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
    StepsSupabaseService,
    AiRecommendationsSupabaseService,
  ],
})
export class SupabaseModule {}
