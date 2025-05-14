import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { CreateUserProfileDto } from 'src/users/dto/create-user-profile.dto';
import { UpdateUserProfileDto } from 'src/users/dto/update-user-profile.dto';
import { CreateFoodDto } from 'src/foods/dto/create-food.dto';
import { FoodResponseDto } from 'src/foods/dto/food-response.dto';
import { SearchFoodResponseDto } from 'src/foods/dto/search-food.dto';
import { DailyDiaryResponseDto } from 'src/diary/dto/daily-diary-response.dto';
import { CreateFoodDiaryEntryDto } from 'src/diary/dto/create-food-diary-entry.dto';
import { FoodDiaryEntryResponseDto } from 'src/diary/dto/food-diary-entry-response.dto';

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

  async createFood(
    accessToken: string,
    userId: string,
    foodData: CreateFoodDto,
    lang: string,
  ): Promise<FoodResponseDto> {
    if (!lang) {
      throw new BadRequestException('Language header is required');
    }

    const client = this.createClientForUser(accessToken);

    // Start a transaction
    const { data: foodCategory, error: categoryError } = await client
      .from('food_categories')
      .select('id')
      .eq('slug', foodData.category)
      .single();

    if (categoryError) {
      throw new InternalServerErrorException(
        `Error while fetching food category: ${categoryError.message}`,
      );
    }

    // Insert into foods table
    const foodPayload = {
      food_category_id: foodCategory.id,
      energy_kcal: parseFloat(foodData.calories),
      energy_kj: parseFloat(foodData.calories) * 4.184, // Convert kcal to kJ
      protein_g: parseFloat(foodData.protein),
      carbs_g: parseFloat(foodData.carbs),
      fat_g: parseFloat(foodData.fats),
      fiber_g: parseFloat(foodData.fiber),
      sugar_g: parseFloat(foodData.sugar),
      salt_g: parseFloat(foodData.salt),
      created_by: userId,
      is_custom: true,
      food_name: foodData.name, // Store the default name in the foods table
    };

    const { data: newFood, error: foodError } = await client
      .from('foods')
      .insert(foodPayload)
      .select()
      .single();

    if (foodError) {
      throw new InternalServerErrorException(
        `Error while creating food: ${foodError.message}`,
      );
    }

    // Insert into food_translations table
    const translationPayload = {
      food_id: newFood.id,
      locale: lang,
      name: foodData.name,
      brand: foodData.brand,
    };

    const { error: translationError } = await client
      .from('food_translations')
      .insert(translationPayload);

    if (translationError) {
      // If translation fails, try to delete the food entry to maintain consistency
      await client.from('foods').delete().eq('id', newFood.id);
      throw new InternalServerErrorException(
        `Error while creating food translation: ${translationError.message}`,
      );
    }

    // Create a default portion
    const portionPayload = {
      food_id: newFood.id,
      portion_weight_g: parseFloat(foodData.servingSizeValue),
    };

    const { data: newPortion, error: portionError } = await client
      .from('food_portions')
      .insert(portionPayload)
      .select()
      .single();

    if (portionError) {
      // If portion creation fails, try to clean up
      await client.from('food_translations').delete().eq('food_id', newFood.id);
      await client.from('foods').delete().eq('id', newFood.id);
      throw new InternalServerErrorException(
        `Error while creating food portion: ${portionError.message}`,
      );
    }

    // Insert portion translation
    const portionTranslationPayload = {
      food_portion_id: newPortion.id,
      locale: lang,
      name: `${foodData.servingSizeValue} ${foodData.servingSizeUnit}`,
    };

    const { error: portionTranslationError } = await client
      .from('food_portions_translations')
      .insert(portionTranslationPayload);

    if (portionTranslationError) {
      // If portion translation fails, try to clean up
      await client.from('food_portions').delete().eq('id', newPortion.id);
      await client.from('food_translations').delete().eq('food_id', newFood.id);
      await client.from('foods').delete().eq('id', newFood.id);
      throw new InternalServerErrorException(
        `Error while creating food portion translation: ${portionTranslationError.message}`,
      );
    }

    // Return the created food data
    const response: FoodResponseDto = {
      id: newFood.id,
      created_at: newFood.created_at,
      updated_at: newFood.created_at,
      name: foodData.name,
      category: foodData.category,
      servingSizeValue: foodData.servingSizeValue,
      servingSizeUnit: foodData.servingSizeUnit,
      brand: foodData.brand,
      barcode: foodData.barcode,
      calories: foodData.calories,
      fats: foodData.fats,
      carbs: foodData.carbs,
      sugar: foodData.sugar,
      fiber: foodData.fiber,
      protein: foodData.protein,
      salt: foodData.salt,
    };

    return response;
  }

  async searchFoods(
    accessToken: string,
    page: number = 1,
    limit: number = 10,
    query: string = '',
    lang: string,
  ): Promise<SearchFoodResponseDto> {
    if (!lang) {
      throw new BadRequestException('Language header is required');
    }

    const client = this.createClientForUser(accessToken);
    const offset = (page - 1) * limit;

    // Create a query builder
    let foodsQuery = client
      .from('foods')
      .select(
        `
        *,
        food_translations!inner(name, brand),
        food_category:food_categories(slug),
        food_portions(
          id, 
          portion_weight_g,
          food_portions_translations!inner(name)
        )
      `,
        { count: 'exact' },
      )
      .eq('food_translations.locale', lang)
      .eq('food_portions.food_portions_translations.locale', lang);

    // Add search condition if query is provided
    if (query && query.trim() !== '') {
      foodsQuery = foodsQuery.ilike('food_translations.name', `%${query}%`);
    }

    // Add pagination
    const { data, error, count } = await foodsQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while searching foods: ${error.message}`,
      );
    }

    // Transform the data to match FoodResponseDto
    const foodItems: FoodResponseDto[] = data.map((item) => {
      // Get the default portion (first one) if available
      const defaultPortion =
        item.food_portions && item.food_portions.length > 0
          ? item.food_portions[0]
          : null;

      // Extract serving size information from the portion name (e.g., "100 g")
      let servingSizeValue = '';
      let servingSizeUnit: 'g' | 'ml' = 'g'; // Default unit

      if (defaultPortion) {
        servingSizeValue = defaultPortion.portion_weight_g.toString();

        // Try to extract unit from portion name if available
        if (
          defaultPortion.food_portions_translations &&
          defaultPortion.food_portions_translations.length > 0
        ) {
          const portionName = defaultPortion.food_portions_translations[0].name;
          if (portionName) {
            // Check if the portion name contains "ml" to determine the unit
            servingSizeUnit = portionName.toLowerCase().includes('ml')
              ? 'ml'
              : 'g';
          }
        }
      }

      return {
        id: item.id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        name: item.food_translations[0]?.name,
        category: item.food_category.slug,
        servingSizeValue: servingSizeValue,
        servingSizeUnit: servingSizeUnit,
        brand: item.food_translations[0]?.brand,
        barcode: item.barcode,
        calories: item.energy_kcal.toString(),
        fats: item.fat_g.toString(),
        carbs: item.carbs_g.toString(),
        sugar: item.sugar_g?.toString(),
        fiber: item.fiber_g?.toString(),
        protein: item.protein_g.toString(),
        salt: item.salt_g?.toString(),
      };
    });

    // Create the response
    const totalCount = count || 0;
    const hasMore = totalCount > page * limit;

    return {
      items: foodItems,
      totalCount,
      page,
      limit,
      hasMore,
    };
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
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw new NotFoundException(
          `Error while fetching user profile: ${profileError.message}`,
        );
      }

      // Create a new daily diary entry
      const newDiaryEntry = {
        user_id: userId,
        day_date: formattedDate,
        calorie_goal: userProfile.calorie_goal || 0,
        calories_consumed: 0,
        calories_burned: 0,
        protein_goal_g: userProfile.protein_goal_g || 0,
        carbs_goal_g: userProfile.carbs_goal_g || 0,
        fat_goal_g: userProfile.fat_goal_g || 0,
        protein_consumed_g: 0,
        carbs_consumed_g: 0,
        fat_consumed_g: 0,
        protein_ratio: 0,
        carbs_ratio: 0,
        fat_ratio: 0,
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
