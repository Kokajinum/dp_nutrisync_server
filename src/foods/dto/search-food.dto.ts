import { FoodResponseDto } from './food-response.dto';
import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchFoodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  query?: string = '';
}

export class SearchFoodResponseDto {
  items: FoodResponseDto[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
