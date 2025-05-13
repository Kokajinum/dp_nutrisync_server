import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [FoodsController],
})
export class FoodsModule {}
