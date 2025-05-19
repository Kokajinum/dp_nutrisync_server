import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStepMeasurementDto {
  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  step_count: number;

  @IsString()
  @IsOptional()
  source?: string;
}
