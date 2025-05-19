import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ActivityDiaryEntryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsUUID()
  exercise_id: string;

  @IsNotEmpty()
  @IsArray()
  sets_json: Array<{ reps: number; weight_kg: number }>;

  @IsOptional()
  @IsNumber()
  est_kcal?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateActivityDiaryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsDateString()
  start_at: string;

  @IsNotEmpty()
  @IsDateString()
  end_at: string;

  @IsOptional()
  @IsNumber()
  bodyweight_kg?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDiaryEntryDto)
  entries: ActivityDiaryEntryDto[];
}
