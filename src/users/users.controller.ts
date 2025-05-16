import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  UseGuards,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersSupabaseService } from '../supabase/users-supabase.service';
import { Request } from 'express';
import { SupabaseClientFactory } from 'src/supabase/supabase-client.factory';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersSupabaseService: UsersSupabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @AuthToken() accessToken: string,
  ): Promise<UserProfileResponseDto> {
    const data = await this.usersSupabaseService.getUserProfile(accessToken);
    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createProfile(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() userProfileDto: CreateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };
    const data = await this.usersSupabaseService.createUserProfile(
      accessToken,
      user.userId,
      user.email,
      userProfileDto,
    );

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const user = req.user as { userId: string; username: string };
    return this.usersSupabaseService.updateUserProfile(
      accessToken,
      user.userId,
      updateUserProfileDto,
    );
  }
}
