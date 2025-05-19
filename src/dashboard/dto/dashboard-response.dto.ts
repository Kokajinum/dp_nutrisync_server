import { FoodDiaryEntryResponseDto } from 'src/diary/dto/food-diary-entry-response.dto';
import { ActivityDiaryEntryResponseDto } from 'src/diary/dto/activity-diary-entry-response.dto';
import { UserWeightDto } from 'src/users/dto/user-weight.dto';
import { StepMeasurementResponseDto } from 'src/steps/dto/step-measurement-response.dto';
import { AiRecommendationResponseDto } from 'src/ai-recommendations/dto/ai-recommendation-response.dto';

export class DashboardResponseDto {
  recent_food_entries: FoodDiaryEntryResponseDto[];
  recent_activity_entries: ActivityDiaryEntryResponseDto[];
  weight_history_7days: UserWeightDto[];
  weight_history_30days: UserWeightDto[];
  steps_history_7days: StepMeasurementResponseDto[];
  steps_history_30days: StepMeasurementResponseDto[];
  ai_recommendations: AiRecommendationResponseDto[];
}
