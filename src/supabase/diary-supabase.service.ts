import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { BaseSupabaseService } from './base-supabase.service';
import { DailyDiaryResponseDto } from 'src/diary/dto/daily-diary-response.dto';
import { CreateFoodDiaryEntryDto } from 'src/diary/dto/create-food-diary-entry.dto';
import { FoodDiaryEntryResponseDto } from 'src/diary/dto/food-diary-entry-response.dto';
import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { ActivityDiaryResponseDto } from 'src/diary/dto/activity-diary-response.dto';
import { CreateActivityDiaryDto } from 'src/diary/dto/create-activity-diary.dto';

@Injectable()
export class DiarySupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  // Activity Diary Methods
  async getActivityDiary(
    accessToken: string,
    userId: string,
    diaryId: string,
  ): Promise<ActivityDiaryResponseDto> {
    const client = this.createClientForUser(accessToken);

    // Get the activity diary
    const { data: diaryData, error: diaryError } = await client
      .from('activity_diary')
      .select('*')
      .eq('id', diaryId)
      .eq('user_id', userId)
      .single();

    if (diaryError) {
      throw new NotFoundException(
        `Activity diary not found: ${diaryError.message}`,
      );
    }

    // Get the activity diary entries
    const { data: entriesData, error: entriesError } = await client
      .from('activity_diary_entry')
      .select('*')
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: true });

    if (entriesError) {
      throw new InternalServerErrorException(
        `Error while fetching activity diary entries: ${entriesError.message}`,
      );
    }

    // Build the response
    const response: ActivityDiaryResponseDto = {
      ...diaryData,
      entries: entriesData || [],
    };

    return response;
  }

  async getActivityDiaryByDate(
    accessToken: string,
    userId: string,
    date: string,
  ): Promise<ActivityDiaryResponseDto | null> {
    const client = this.createClientForUser(accessToken);

    // Format date for query (start of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // End of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Find ActivityDiary for the given day
    const { data: diaryData, error: diaryError } = await client
      .from('activity_diary')
      .select('*')
      .eq('user_id', userId)
      .gte('start_at', startDate.toISOString())
      .lt('start_at', endDate.toISOString())
      .order('start_at', { ascending: true })
      .maybeSingle();

    if (diaryError) {
      throw new InternalServerErrorException(
        `Error while fetching activity diary: ${diaryError.message}`,
      );
    }

    // If no record was found, return null
    if (!diaryData) {
      return null;
    }

    // Get entries for the found diary
    const { data: entriesData, error: entriesError } = await client
      .from('activity_diary_entry')
      .select('*')
      .eq('diary_id', diaryData.id)
      .order('created_at', { ascending: true });

    if (entriesError) {
      throw new InternalServerErrorException(
        `Error while fetching activity diary entries: ${entriesError.message}`,
      );
    }

    // Build the response
    const response: ActivityDiaryResponseDto = {
      ...diaryData,
      entries: entriesData || [],
    };

    return response;
  }

  async getAllActivityDiaries(
    accessToken: string,
    userId: string,
  ): Promise<ActivityDiaryResponseDto[]> {
    const client = this.createClientForUser(accessToken);

    // Get all activity diaries for the user
    const { data: diariesData, error: diariesError } = await client
      .from('activity_diary')
      .select('*')
      .eq('user_id', userId)
      .order('start_at', { ascending: false });

    if (diariesError) {
      throw new InternalServerErrorException(
        `Error while fetching activity diaries: ${diariesError.message}`,
      );
    }

    if (!diariesData || diariesData.length === 0) {
      return [];
    }

    // Get all entries for all diaries
    const diaryIds = diariesData.map((diary) => diary.id);
    const { data: entriesData, error: entriesError } = await client
      .from('activity_diary_entry')
      .select('*')
      .in('diary_id', diaryIds)
      .order('created_at', { ascending: true });

    if (entriesError) {
      throw new InternalServerErrorException(
        `Error while fetching activity diary entries: ${entriesError.message}`,
      );
    }

    // Group entries by diary_id
    const entriesByDiaryId = (entriesData || []).reduce((acc, entry) => {
      if (!acc[entry.diary_id]) {
        acc[entry.diary_id] = [];
      }
      acc[entry.diary_id].push(entry);
      return acc;
    }, {});

    // Build the response
    const response = diariesData.map((diary) => ({
      ...diary,
      entries: entriesByDiaryId[diary.id] || [],
    }));

    return response;
  }

  async saveActivityDiary(
    accessToken: string,
    userId: string,
    diaryData: CreateActivityDiaryDto,
  ): Promise<ActivityDiaryResponseDto> {
    const client = this.createClientForUser(accessToken);

    try {
      let diaryId: string | undefined = diaryData.id;
      let isNewDiary = false;

      // If diary ID is provided, update the existing diary
      if (diaryId !== undefined) {
        // Check if the diary exists and belongs to the user
        const { data: existingDiary, error: checkError } = await client
          .from('activity_diary')
          .select('id')
          .eq('id', diaryId)
          .eq('user_id', userId)
          .single();

        if (checkError || !existingDiary) {
          throw new NotFoundException(
            `Activity diary not found or does not belong to the user`,
          );
        }

        // Update the diary
        const { error: updateError } = await client
          .from('activity_diary')
          .update({
            start_at: diaryData.start_at,
            end_at: diaryData.end_at,
            bodyweight_kg: diaryData.bodyweight_kg,
            notes: diaryData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', diaryId)
          .eq('user_id', userId);

        if (updateError) {
          throw new InternalServerErrorException(
            `Error updating activity diary: ${updateError.message}`,
          );
        }
      } else {
        // Create a new diary
        isNewDiary = true;
        const { data: newDiary, error: createError } = await client
          .from('activity_diary')
          .insert({
            user_id: userId,
            start_at: diaryData.start_at,
            end_at: diaryData.end_at,
            bodyweight_kg: diaryData.bodyweight_kg,
            notes: diaryData.notes,
          })
          .select()
          .single();

        if (createError) {
          throw new InternalServerErrorException(
            `Error creating activity diary: ${createError.message}`,
          );
        }

        diaryId = newDiary.id;
      }

      // Process entries
      if (!isNewDiary) {
        // Get existing entries to determine which ones to delete
        const { data: existingEntries, error: fetchError } = await client
          .from('activity_diary_entry')
          .select('id')
          .eq('diary_id', diaryId);

        if (fetchError) {
          throw new InternalServerErrorException(
            `Error fetching existing entries: ${fetchError.message}`,
          );
        }

        // Find entries to delete (those in DB but not in the request)
        const newEntryIds = diaryData.entries
          .filter((e) => e.id)
          .map((e) => e.id);
        const entriesToDelete = existingEntries
          .filter((e) => !newEntryIds.includes(e.id))
          .map((e) => e.id);

        // Delete entries that are not in the request
        if (entriesToDelete.length > 0) {
          const { error: deleteError } = await client
            .from('activity_diary_entry')
            .delete()
            .in('id', entriesToDelete);

          if (deleteError) {
            throw new InternalServerErrorException(
              `Error deleting activity diary entries: ${deleteError.message}`,
            );
          }
        }
      }

      // Process each entry
      for (const entry of diaryData.entries) {
        if (entry.id) {
          // Update existing entry
          const { error: updateEntryError } = await client
            .from('activity_diary_entry')
            .update({
              exercise_id: entry.exercise_id,
              sets_json: entry.sets_json,
              est_kcal: entry.est_kcal || 0,
              notes: entry.notes || '',
            })
            .eq('id', entry.id)
            .eq('diary_id', diaryId);

          if (updateEntryError) {
            throw new InternalServerErrorException(
              `Error updating activity diary entry: ${updateEntryError.message}`,
            );
          }
        } else {
          // Create new entry
          const { error: createEntryError } = await client
            .from('activity_diary_entry')
            .insert({
              diary_id: diaryId,
              exercise_id: entry.exercise_id,
              sets_json: entry.sets_json,
              est_kcal: entry.est_kcal || 0,
              notes: entry.notes || '',
            });

          if (createEntryError) {
            throw new InternalServerErrorException(
              `Error creating activity diary entry: ${createEntryError.message}`,
            );
          }
        }
      }

      // Return the updated diary
      if (!diaryId) {
        throw new InternalServerErrorException(
          'Failed to get diary ID after save operation',
        );
      }

      return this.getActivityDiary(accessToken, userId, diaryId);
    } catch (error) {
      // Just rethrow the error without rollback
      throw error;
    }
  }

  async getDailyDiary(
    accessToken: string,
    userId: string,
    date: string,
  ): Promise<DailyDiaryResponseDto> {
    const client = this.createClientForUser(accessToken);

    // Format the date for the query
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // First check if a record exists for the given day
    let { data: diaryData, error: diaryError } = await client
      .from('daily_diary')
      .select('*')
      .eq('user_id', userId)
      .eq('day_date', formattedDate)
      .single();

    // If the record doesn't exist, create a new one
    if (!diaryData) {
      // Get the user profile for default values
      const { data, error: profileError } = await client
        .from('user_profiles')
        .select('*')
        .single();
      const userProfileData: UserProfileResponseDto = data;

      if (profileError) {
        throw new NotFoundException(
          `Error while fetching user profile: ${profileError.message}`,
        );
      }

      // Create a new daily diary entry
      const newDiaryEntry = {
        user_id: userId,
        day_date: formattedDate,
        calorie_goal: userProfileData.calorie_goal_value || 0,
        calories_consumed: 0,
        calories_burned: 0,
        protein_goal_g: userProfileData.protein_goal_g || 0,
        carbs_goal_g: userProfileData.carbs_goal_g || 0,
        fat_goal_g: userProfileData.fat_goal_g || 0,
        protein_consumed_g: 0,
        carbs_consumed_g: 0,
        fat_consumed_g: 0,
        protein_ratio: userProfileData.protein_ratio,
        carbs_ratio: userProfileData.carbs_ratio,
        fat_ratio: userProfileData.fat_ratio,
      };

      const { data: newDiary, error: createError } = await client
        .from('daily_diary')
        .insert(newDiaryEntry)
        .select()
        .single();

      if (createError) {
        throw new InternalServerErrorException(
          `Error while creating daily diary: ${createError.message}`,
        );
      }

      diaryData = newDiary;
    }

    // Get food entries for the day
    const { data: foodEntries, error: entriesError } = await client
      .from('food_diary_entry')
      .select('*')
      .eq('day_id', diaryData.id)
      .order('created_at', { ascending: true });

    if (entriesError) {
      throw new InternalServerErrorException(
        `Error while fetching food entries: ${entriesError.message}`,
      );
    }

    // Build the response
    const response: DailyDiaryResponseDto = {
      ...diaryData,
      food_entries: foodEntries || [],
    };

    return response;
  }

  async createFoodDiaryEntry(
    accessToken: string,
    userId: string,
    entryData: CreateFoodDiaryEntryDto,
  ): Promise<FoodDiaryEntryResponseDto> {
    const client = this.createClientForUser(accessToken);

    // Get or create daily diary for the entry date
    const entryDate = entryData.entry_date
      ? new Date(entryData.entry_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Get the daily diary ID
    const diaryData = await this.getDailyDiary(accessToken, userId, entryDate);

    // Create the food entry
    const foodEntryPayload = {
      user_id: userId,
      day_id: diaryData.id,
      food_id: entryData.food_id,
      food_name: entryData.food_name,
      brand: entryData.brand || '',
      meal_type: entryData.meal_type,
      serving_size: entryData.serving_size,
      serving_unit: entryData.serving_unit,
      calories: entryData.calories,
      protein: entryData.protein,
      carbs: entryData.carbs,
      fat: entryData.fat,
    };

    const { data: newEntry, error: entryError } = await client
      .from('food_diary_entry')
      .insert(foodEntryPayload)
      .select()
      .single();

    if (entryError) {
      throw new InternalServerErrorException(
        `Error while creating food diary entry: ${entryError.message}`,
      );
    }

    // Update the daily diary totals
    await this.updateDailyDiaryTotals(client, diaryData.id);

    return newEntry;
  }

  async deleteFoodDiaryEntry(
    accessToken: string,
    userId: string,
    entryId: string,
  ): Promise<{ success: boolean }> {
    const client = this.createClientForUser(accessToken);

    // First get the entry to have the day_id
    const { data: entry, error: fetchError } = await client
      .from('food_diary_entry')
      .select('day_id')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new NotFoundException(
        `Food diary entry not found: ${fetchError.message}`,
      );
    }

    // Delete the entry
    const { error: deleteError } = await client
      .from('food_diary_entry')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new InternalServerErrorException(
        `Error while deleting food diary entry: ${deleteError.message}`,
      );
    }

    // Update the daily diary totals
    await this.updateDailyDiaryTotals(client, entry.day_id);

    return { success: true };
  }

  private async updateDailyDiaryTotals(
    client: SupabaseClient,
    diaryId: string,
  ): Promise<void> {
    // Get all food entries for the diary
    const { data: entries, error: entriesError } = await client
      .from('food_diary_entry')
      .select('calories, protein, carbs, fat')
      .eq('day_id', diaryId);

    if (entriesError) {
      throw new InternalServerErrorException(
        `Error while fetching food entries: ${entriesError.message}`,
      );
    }

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => {
        acc.calories += entry.calories;
        acc.protein += entry.protein;
        acc.carbs += entry.carbs;
        acc.fat += entry.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    // Get the daily diary to update
    const { data: diary, error: diaryError } = await client
      .from('daily_diary')
      .select('user_id')
      .eq('id', diaryId)
      .single();

    if (diaryError) {
      throw new InternalServerErrorException(
        `Error while fetching daily diary: ${diaryError.message}`,
      );
    }

    // Get user profile to get the ratio values
    const { data: userProfile, error: profileError } = await client
      .from('user_profiles')
      .select('protein_ratio, carbs_ratio, fat_ratio')
      .eq('user_id', diary.user_id)
      .single();

    if (profileError) {
      throw new InternalServerErrorException(
        `Error while fetching user profile: ${profileError.message}`,
      );
    }

    // Update the daily diary with the calculated totals and ratios from user profile
    const { error: updateError } = await client
      .from('daily_diary')
      .update({
        calories_consumed: totals.calories,
        protein_consumed_g: totals.protein,
        carbs_consumed_g: totals.carbs,
        fat_consumed_g: totals.fat,
        protein_ratio: userProfile.protein_ratio,
        carbs_ratio: userProfile.carbs_ratio,
        fat_ratio: userProfile.fat_ratio,
      })
      .eq('id', diaryId);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error while updating daily diary totals: ${updateError.message}`,
      );
    }
  }
}
