import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
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

    // Check if calorie goal or macronutrient ratios are being updated
    const calorieGoalUpdated = updateData.calorie_goal_value !== undefined;
    const macroRatiosUpdated =
      updateData.protein_ratio !== undefined ||
      updateData.carbs_ratio !== undefined ||
      updateData.fat_ratio !== undefined;

    // If macronutrient ratios are being updated, recalculate the macronutrient goals
    let updatedProfilePayload = { ...updateData };
    if (calorieGoalUpdated || macroRatiosUpdated) {
      // Get current profile to have complete data for calculations
      const { data: currentProfile, error: profileError } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw new InternalServerErrorException(
          `Error while fetching current user profile: ${profileError.message}`,
        );
      }

      // Calculate new macronutrient goals based on updated values
      const calorieGoal =
        updateData.calorie_goal_value !== undefined
          ? updateData.calorie_goal_value
          : currentProfile.calorie_goal_value;

      const proteinRatio =
        updateData.protein_ratio !== undefined
          ? updateData.protein_ratio
          : currentProfile.protein_ratio;

      const carbsRatio =
        updateData.carbs_ratio !== undefined
          ? updateData.carbs_ratio
          : currentProfile.carbs_ratio;

      const fatRatio =
        updateData.fat_ratio !== undefined
          ? updateData.fat_ratio
          : currentProfile.fat_ratio;

      // Calculate macronutrient goals in grams
      updatedProfilePayload.protein_goal_g = Math.round(
        (calorieGoal * (proteinRatio * 0.01)) / 4,
      );
      updatedProfilePayload.carbs_goal_g = Math.round(
        (calorieGoal * (carbsRatio * 0.01)) / 4,
      );
      updatedProfilePayload.fat_goal_g = Math.round(
        (calorieGoal * (fatRatio * 0.01)) / 9,
      );
    }

    // Remove weight data from profile payload
    const { weight_value, weight_unit, ...profilePayload } =
      updatedProfilePayload;

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

    // Update diary entries if calorie goal or macronutrient ratios were updated
    if (calorieGoalUpdated || macroRatiosUpdated) {
      await this.updateDiaryEntriesAfterProfileUpdate(
        client,
        userId,
        updatedProfilePayload,
      );
    }

    return data;
  }

  /**
   * Updates all diary entries after a user profile update
   * This method is called when calorie goal or macronutrient ratios are updated
   * It updates the calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, and ratio values in all diary entries
   */
  private async updateDiaryEntriesAfterProfileUpdate(
    client: SupabaseClient,
    userId: string,
    profileData: UpdateUserProfileDto,
  ): Promise<void> {
    // Get all daily diary entries for the user
    const { data: diaries, error: diariesError } = await client
      .from('daily_diary')
      .select('id')
      .eq('user_id', userId);

    if (diariesError) {
      throw new InternalServerErrorException(
        `Error while fetching daily diaries: ${diariesError.message}`,
      );
    }

    if (!diaries || diaries.length === 0) {
      return; // No diaries to update
    }

    // Extract the updated values
    const updates: any = {};

    // Update calorie goal if provided
    if (profileData.calorie_goal_value !== undefined) {
      updates.calorie_goal = profileData.calorie_goal_value;
    }

    // Update macronutrient goals if calculated
    if (profileData.protein_goal_g !== undefined) {
      updates.protein_goal_g = profileData.protein_goal_g;
    }

    if (profileData.carbs_goal_g !== undefined) {
      updates.carbs_goal_g = profileData.carbs_goal_g;
    }

    if (profileData.fat_goal_g !== undefined) {
      updates.fat_goal_g = profileData.fat_goal_g;
    }

    // Update macronutrient ratios if provided
    if (profileData.protein_ratio !== undefined) {
      updates.protein_ratio = profileData.protein_ratio;
    }

    if (profileData.carbs_ratio !== undefined) {
      updates.carbs_ratio = profileData.carbs_ratio;
    }

    if (profileData.fat_ratio !== undefined) {
      updates.fat_ratio = profileData.fat_ratio;
    }

    // If there are no updates, return
    if (Object.keys(updates).length === 0) {
      return;
    }

    // Update all diary entries
    for (const diary of diaries) {
      const { error: updateError } = await client
        .from('daily_diary')
        .update(updates)
        .eq('id', diary.id);

      if (updateError) {
        throw new InternalServerErrorException(
          `Error while updating daily diary: ${updateError.message}`,
        );
      }
    }
  }
}
