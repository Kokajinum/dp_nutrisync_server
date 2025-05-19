import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
