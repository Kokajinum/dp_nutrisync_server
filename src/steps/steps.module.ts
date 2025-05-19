import { Module } from '@nestjs/common';
import { StepsController } from './steps.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [StepsController],
})
export class StepsModule {}
