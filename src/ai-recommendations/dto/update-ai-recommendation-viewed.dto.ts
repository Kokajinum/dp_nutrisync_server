import { IsString } from 'class-validator';

export class UpdateAiRecommendationViewedDto {
  @IsString()
  id: string;
}
