export class FoodResponseDto {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: string;
  servingSizeValue: string;
  servingSizeUnit: 'g' | 'ml';
  brand: string;
  barcode: string;
  calories: string;
  fats: string;
  carbs: string;
  sugar: string;
  fiber: string;
  protein: string;
  salt: string;
}
