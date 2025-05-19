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
import { UserWeightDto } from 'src/users/dto/user-weight.dto';
import { WeightUnitEnum } from 'src/common/enums/enums';

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

    // Get the latest weight record
    const latestWeight = await this.getLatestUserWeight(
      accessToken,
      userProfileData.user_id,
    );

    // If we have a weight record, update the weight_value in the response
    if (latestWeight) {
      userProfileData.weight_value = latestWeight.weight_kg;
      userProfileData.weight_unit = WeightUnitEnum.KG;
    }

    return userProfileData;
  }

  async createUserWeight(
    accessToken: string,
    userId: string,
    weight: number,
    source: string = 'manual',
    measured_at?: string,
  ): Promise<UserWeightDto> {
    const client = this.createClientForUser(accessToken);
    const payload = {
      user_id: userId,
      weight_kg: weight,
      source,
      measured_at: measured_at || new Date().toISOString(),
    };

    const { data, error } = await client
      .from('user_weights')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while creating weight record: ${error.message}`,
      );
    }

    return data;
  }

  async getLatestUserWeight(
    accessToken: string,
    userId: string,
  ): Promise<UserWeightDto | null> {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_weights')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error
      throw new InternalServerErrorException(
        `Error while fetching weight record: ${error.message}`,
      );
    }

    return data || null;
  }

  async getUserWeightHistory(
    accessToken: string,
    userId: string,
  ): Promise<UserWeightDto[]> {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_weights')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching weight history: ${error.message}`,
      );
    }

    return data || [];
  }

  async getUserWeightHistoryLast7Days(
    accessToken: string,
    userId: string,
  ): Promise<UserWeightDto[]> {
    const client = this.createClientForUser(accessToken);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);

    const { data, error } = await client
      .from('user_weights')
      .select('*')
      .eq('user_id', userId)
      .gte('measured_at', dateLimit.toISOString())
      .order('measured_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching weight history: ${error.message}`,
      );
    }

    return data || [];
  }

  async getUserWeightHistoryLast30Days(
    accessToken: string,
    userId: string,
  ): Promise<UserWeightDto[]> {
    const client = this.createClientForUser(accessToken);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);

    const { data, error } = await client
      .from('user_weights')
      .select('*')
      .eq('user_id', userId)
      .gte('measured_at', dateLimit.toISOString())
      .order('measured_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching weight history: ${error.message}`,
      );
    }

    return data || [];
  }

  async createUserProfile(
    accessToken: string,
    userId: string,
    email: string,
    profileData: CreateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    const client = this.createClientForUser(accessToken);

    // Extract weight data
    const weightValue = profileData.weight_value;
    const weightUnit = profileData.weight_unit;

    // Remove weight data from profile payload (using destructuring and rest operator)
    const { weight_value, weight_unit, ...profilePayload } = profileData;

    // Add user_id and email
    const payload = {
      ...profilePayload,
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

    // Create weight record if weight data was provided
    if (weightValue !== undefined) {
      // Convert to kg if needed
      const weightInKg =
        weightUnit === WeightUnitEnum.LBS
          ? weightValue * 0.45359237
          : weightValue;

      await this.createUserWeight(
        accessToken,
        userId,
        weightInKg,
        'profile_creation',
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

    // Extract weight data
    const weightValue = updateData.weight_value;
    const weightUnit = updateData.weight_unit;

    // Remove weight data from profile payload
    const { weight_value, weight_unit, ...profilePayload } = updateData;

    const { data, error } = await client
      .from('user_profiles')
      .update(profilePayload)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while updating the user profile: ${error.message}`,
      );
    }

    // Create weight record if weight data was provided
    if (weightValue !== undefined) {
      // Convert to kg if needed
      const weightInKg =
        weightUnit === WeightUnitEnum.LBS
          ? weightValue * 0.45359237
          : weightValue;

      await this.createUserWeight(
        accessToken,
        userId,
        weightInKg,
        'profile_update',
      );
    }

    return data;
  }
}
