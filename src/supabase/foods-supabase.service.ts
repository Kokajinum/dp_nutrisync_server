import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSupabaseService } from './base-supabase.service';
import { CreateFoodDto } from 'src/foods/dto/create-food.dto';
import { FoodResponseDto } from 'src/foods/dto/food-response.dto';
import { SearchFoodResponseDto } from 'src/foods/dto/search-food.dto';

@Injectable()
export class FoodsSupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
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
}
