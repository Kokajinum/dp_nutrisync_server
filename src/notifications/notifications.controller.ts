import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsSupabaseService } from '../supabase/notifications-supabase.service';
import { AuthToken } from '../common/decorators/auth-token.decorator';
import { IsString } from 'class-validator';

class RegisterPushTokenDto {
  @IsString()
  push_token: string;
  @IsString()
  device_id?: string;
  @IsString()
  device_name?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsSupabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register-token')
  async registerPushToken(
    @AuthToken() token: string,
    @Req() req: any,
    @Body() registerPushTokenDto: RegisterPushTokenDto,
  ) {
    const userId = req.user.userId;

    await this.notificationsService.registerPushToken(
      userId,
      registerPushTokenDto.push_token,
      registerPushTokenDto.device_id,
      registerPushTokenDto.device_name,
    );

    return { success: true };
  }
}
