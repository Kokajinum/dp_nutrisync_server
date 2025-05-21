export class CreateAiRecommendationDto {
  user_id: string;
  analyzed_date: Date;
  prompt_version: number;
  prompt: string;
  response: string;
  model_used: string;
  error_message?: string;
}
