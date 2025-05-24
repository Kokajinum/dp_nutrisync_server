import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDto } from './create-user-profile.dto';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
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

export class UpdateUserProfileDto {
  @IsOptional()
  id?: string;

  @IsOptional()
  @IsBoolean()
  onboarding_completed?: boolean;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height_value?: number;

  @IsOptional()
  @IsEnum(HeightUnitEnum)
  height_unit?: HeightUnitEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight_value?: number;

  @IsOptional()
  @IsEnum(WeightUnitEnum)
  weight_unit?: WeightUnitEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  target_weight_value?: number;

  @IsOptional()
  @IsEnum(WeightUnitEnum)
  target_weight_unit?: WeightUnitEnum;

  @IsOptional()
  @IsEnum(ActivityLevelEnum)
  activity_level?: ActivityLevelEnum;

  @IsOptional()
  @IsEnum(ExperienceLevelEnum)
  experience_level?: ExperienceLevelEnum;

  @IsOptional()
  @IsEnum(GoalEnum)
  goal?: GoalEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  calorie_goal_value?: number;

  @IsOptional()
  @IsEnum(CalorieUnitEnum)
  calorie_goal_unit?: CalorieUnitEnum;

  @IsOptional()
  @IsNumber()
  protein_ratio?: number;

  @IsOptional()
  @IsNumber()
  fat_ratio?: number;

  @IsOptional()
  @IsNumber()
  carbs_ratio?: number;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @IsNumber()
  protein_goal_g: number;

  @IsOptional()
  @IsNumber()
  carbs_goal_g: number;

  @IsOptional()
  @IsNumber()
  fat_goal_g: number;

  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;
}
