import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DiaryController],
})
export class DiaryModule {}
