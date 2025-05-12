import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { CreateUserProfileDto } from 'src/users/dto/create-user-profile.dto';
import { UpdateUserProfileDto } from 'src/users/dto/update-user-profile.dto';

@Injectable()
export class SupabaseService {
  private supabaseUrl: string | undefined;
  private supabaseKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new InternalServerErrorException(
        'Missing Supabase configuration. Please check your configuration file for SUPABASE_URL and SUPABASE_KEY.',
      );
    }
  }

  createClientForUser(accessToken: string): SupabaseClient {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new InternalServerErrorException(
        'Missing Supabase configuration. Please check your configuration file for SUPABASE_URL and SUPABASE_KEY.',
      );
    }
    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfileResponseDto> {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      //.eq('user_id', userId)
      .single();

    if (error) {
      throw new NotFoundException(
        `Error while fetching the user profile: ${error.message}`,
      );
    }

    const userProfileData: UserProfileResponseDto = data;

    return userProfileData;
  }

  async createUserProfile(
    accessToken: string,
    userId: string,
    email: string,
    profileData: CreateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    const client = this.createClientForUser(accessToken);
    // složíme odesílaný objekt z přijatých dat + user id
    const payload = {
      ...profileData,
      user_id: userId,
      email: email,
    };

    const { data, error } = await client
      .from('user_profiles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while creating the user profile: ${error.message}`,
      );
    }

    const createUserProfileData: CreateUserProfileDto = data;

    return createUserProfileData;
  }

  async updateUserProfile(
    accessToken: string,
    userId: string,
    updateData: UpdateUserProfileDto,
  ) {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while updating the user profile: ${error.message}`,
      );
    }
    return data;
  }
}
