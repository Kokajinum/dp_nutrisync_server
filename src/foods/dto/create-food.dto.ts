import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateFoodDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  servingSizeValue: string;

  @IsNotEmpty()
  @IsIn(['g', 'ml'])
  servingSizeUnit: 'g' | 'ml';

  @IsNotEmpty()
  @IsString()
  brand: string;

  @IsString()
  barcode: string;

  @IsNotEmpty()
  @IsString()
  calories: string;

  @IsNotEmpty()
  @IsString()
  fats: string;

  @IsNotEmpty()
  @IsString()
  carbs: string;

  @IsNotEmpty()
  @IsString()
  sugar: string;

  @IsNotEmpty()
  @IsString()
  fiber: string;

  @IsNotEmpty()
  @IsString()
  protein: string;

  @IsNotEmpty()
  @IsString()
  salt: string;
}
