import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSupabaseService } from './base-supabase.service';
import { AiRecommendationResponseDto } from 'src/ai-recommendations/dto/ai-recommendation-response.dto';
import { CreateAiRecommendationDto } from 'src/ai-recommendations/dto/create-ai-recommendation.dto';

@Injectable()
export class AiRecommendationsSupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  async getRecommendationsForUser(
    accessToken: string,
    userId: string,
  ): Promise<AiRecommendationResponseDto[]> {
    const client = this.createClientForUser(accessToken);

    const { data, error } = await client
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching AI recommendations: ${error.message}`,
      );
    }

    return data || [];
  }

  async updateRecommendationViewed(
    accessToken: string,
    userId: string,
    recommendationId: string,
  ): Promise<AiRecommendationResponseDto> {
    const client = this.createClientForUser(accessToken);

    const { data, error } = await client
      .from('ai_recommendations')
      .update({ viewed: true })
      .eq('id', recommendationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while updating AI recommendation viewed status: ${error.message}`,
      );
    }

    return data;
  }

  async createRecommendation(
    recommendationData: CreateAiRecommendationDto,
  ): Promise<AiRecommendationResponseDto> {
    const client = this.createClientForUser("", true);

    const { data, error } = await client
      .from('ai_recommendations')
      .insert({
        user_id: recommendationData.user_id,
        analyzed_date: recommendationData.analyzed_date,
        prompt_version: recommendationData.prompt_version,
        prompt: recommendationData.prompt,
        response: recommendationData.response,
        model_used: recommendationData.model_used,
        error_message: recommendationData.error_message || null,
        viewed: false,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while creating AI recommendation: ${error.message}`,
      );
    }

    return data;
  }
}
