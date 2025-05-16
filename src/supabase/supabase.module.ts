import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClientFactory } from './supabase-client.factory';
import { BaseSupabaseService } from './base-supabase.service';
import { UsersSupabaseService } from './users-supabase.service';
import { FoodsSupabaseService } from './foods-supabase.service';
import { DiarySupabaseService } from './diary-supabase.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SupabaseClientFactory,
    BaseSupabaseService,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
  ],
  exports: [
    SupabaseClientFactory,
    UsersSupabaseService,
    FoodsSupabaseService,
    DiarySupabaseService,
  ],
})
export class SupabaseModule {}
