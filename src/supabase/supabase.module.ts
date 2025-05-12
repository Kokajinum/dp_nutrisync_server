import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClientFactory } from './supabase-client.factory';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, SupabaseClientFactory],
  exports: [SupabaseService, SupabaseClientFactory],
})
export class SupabaseModule {}