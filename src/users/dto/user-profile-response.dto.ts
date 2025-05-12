import {
  IsUUID,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import {
  ActivityLevelEnum,
  CalorieUnitEnum,
  GoalEnum,
  HeightUnitEnum,
  WeightUnitEnum,
} from 'src/common/enums/enums';

export class UserProfileResponseDto {
  //@IsUUID()
  id: string;

  // created_at / updated_at bývají spíše read-only pole
  //@IsString()
  created_at: string;

  //@IsString()
  updated_at: string;

  //@IsUUID()
  user_id: string;

  //@IsBoolean()
  onboarding_completed: boolean;

  //@IsString()
  first_name?: string;

  //@IsString()
  last_name?: string;

  //@IsInt()
  age: number;

  //@IsNumber()
  height_value: number;

  //@IsEnum(HeightUnitEnum)
  height_unit: HeightUnitEnum;

  //@IsNumber()
  weight_value: number;

  //@IsEnum(WeightUnitEnum)
  weight_unit: WeightUnitEnum;

  //@IsNumber()
  target_weight_value: number;

  //@IsEnum(WeightUnitEnum)
  target_weight_unit: WeightUnitEnum;

  //@IsEnum(ActivityLevelEnum)
  activity_level: ActivityLevelEnum;

  //@IsEnum(GoalEnum)
  goal: GoalEnum; // nebo GoalEnum

  //@IsNumber()
  calorie_goal_value: number;

  //@IsEnum(CalorieUnitEnum)
  calorie_goal_unit: CalorieUnitEnum;

  //@IsInt()
  protein_ratio: number;

  //@IsInt()
  fat_ratio: number;

  //@IsInt()
  carbs_ratio: number;

  //@IsBoolean()
  notifications_enabled: boolean;
}
