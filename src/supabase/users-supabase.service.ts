import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSupabaseService } from './base-supabase.service';
import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { CreateUserProfileDto } from 'src/users/dto/create-user-profile.dto';
import { UpdateUserProfileDto } from 'src/users/dto/update-user-profile.dto';

@Injectable()
export class UsersSupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  async getUserProfile(accessToken: string): Promise<UserProfileResponseDto> {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
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
