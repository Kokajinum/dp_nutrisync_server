import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
  isEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ActivityLevelEnum,
  CalorieUnitEnum,
  ExperienceLevelEnum,
  GenderEnum,
  GoalEnum,
  HeightUnitEnum,
  WeightUnitEnum,
} from 'src/common/enums/enums';

export class CreateUserProfileDto {
  // ID generuje samotná DB

  @IsOptional()
  id?: string;

  @IsOptional()
  @IsBoolean()
  onboarding_completed?: boolean;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @Type(() => Number)
  @IsNumber()
  height_value?: number;

  @IsEnum(HeightUnitEnum)
  height_unit?: HeightUnitEnum;

  @Type(() => Number)
  @IsNumber()
  weight_value?: number;

  @IsEnum(WeightUnitEnum)
  weight_unit?: WeightUnitEnum;

  @Type(() => Number)
  @IsNumber()
  target_weight_value?: number;

  @IsEnum(WeightUnitEnum)
  target_weight_unit?: WeightUnitEnum;

  @IsEnum(ActivityLevelEnum)
  activity_level?: ActivityLevelEnum;

  @IsEnum(ExperienceLevelEnum)
  experience_level?: ExperienceLevelEnum;

  @IsEnum(GoalEnum)
  goal?: GoalEnum;

  @Type(() => Number)
  @IsNumber()
  calorie_goal_value?: number;

  @IsEnum(CalorieUnitEnum)
  calorie_goal_unit?: CalorieUnitEnum;

  @IsNumber()
  protein_ratio?: number;

  @IsNumber()
  fat_ratio?: number;

  @IsNumber()
  carbs_ratio?: number;

  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsBoolean()
  @IsOptional()
  notifications_enabled?: boolean;
}
