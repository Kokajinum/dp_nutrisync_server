import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { MealTypeEnum } from '../../common/enums/enums';

export class CreateFoodDiaryEntryDto {
  @IsNotEmpty()
  @IsUUID()
  food_id: string;

  @IsNotEmpty()
  @IsString()
  food_name: string;

  @IsOptional()
  @IsString()
  brand: string;

  @IsNotEmpty()
  @IsEnum(MealTypeEnum)
  meal_type: MealTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  serving_size: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['g', 'ml'])
  serving_unit: 'g' | 'ml';

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  calories: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  protein: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fat: number;

  @IsOptional()
  @IsString()
  @IsDateString()
  entry_date: string; // If not provided, current date will be used
}
