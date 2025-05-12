// import { IsOptional, IsBoolean, IsString, IsInt, Min, IsNumber, Validate } from 'class-validator';
// import { Exclude } from 'class-transformer';
// import { MacronutrientSumValidator } from './macronutrient-sum.validator';

// export class UserProfileDto {
//   @IsOptional()
//   @IsString()
//   first_name?: string;

//   @IsOptional()
//   @IsString()
//   last_name?: string;

//   @IsOptional()
//   @IsBoolean()
//   onboarding_completed?: boolean;

//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   age?: number;

//   @IsOptional()
//   @IsNumber()
//   @Min(0.1)
//   height_value?: number;

//   @IsOptional()
//   @IsString()
//   height_unit?: string;

//   @IsOptional()
//   @IsNumber()
//   @Min(0.1)
//   weight_value?: number;

//   @IsOptional()
//   @IsString()
//   weight_unit?: string;

//   @IsOptional()
//   @IsNumber()
//   @Min(0.1)
//   target_weight_value?: number;

//   @IsOptional()
//   @IsString()
//   target_weight_unit?: string;

//   @IsOptional()
//   @IsString()
//   activity_level?: string;

//   @IsOptional()
//   @IsString()
//   goal?: string;

//   @IsOptional()
//   @IsNumber()
//   @Min(0.1)
//   calorie_goal_value?: number;

//   @IsOptional()
//   @IsString()
//   calorie_goal_unit?: string;

//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   protein_ratio?: number;

//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   fat_ratio?: number;

//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   carbs_ratio?: number;

//   @IsOptional()
//   @IsBoolean()
//   notifications_enabled?: boolean;

//   // Dummy vlastnost, na které spustíme validaci součtu makronutrientů.
//   @Exclude()
//   @Validate(MacronutrientSumValidator)
//   macronutrientSumCheck?: any;
// }
