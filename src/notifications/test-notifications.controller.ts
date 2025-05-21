import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { NotificationsSupabaseService } from '../supabase/notifications-supabase.service';

class SendTestNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

@Controller('test-notifications')
export class TestNotificationsController {
  constructor(private notificationsService: NotificationsSupabaseService) {}

  @Post('send')
  async sendTestNotification(@Body() dto: SendTestNotificationDto) {
    await this.notificationsService.sendPushNotification(
      dto.userId,
      dto.title,
      dto.body,
      dto.data || {},
    );

    return { success: true, message: 'Test notification sent' };
  }
}
