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
}
