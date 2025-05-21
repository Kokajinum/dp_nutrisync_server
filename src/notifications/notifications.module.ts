import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { TestNotificationsController } from './test-notifications.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsSupabaseService } from '../supabase/notifications-supabase.service';

@Module({
  imports: [SupabaseModule],
  controllers: [NotificationsController, TestNotificationsController],
  providers: [NotificationsSupabaseService],
  exports: [NotificationsSupabaseService],
})
export class NotificationsModule {}
