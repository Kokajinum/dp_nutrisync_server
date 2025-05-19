import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { WeightUnitEnum } from 'src/common/enums/enums';
import { Type } from 'class-transformer';

export class CreateUserWeightDto {
  @Type(() => Number)
  @IsNumber()
  weight_value: number;

  @IsEnum(WeightUnitEnum)
  weight_unit: WeightUnitEnum;

  @IsString()
  @IsOptional()
  measured_at?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
