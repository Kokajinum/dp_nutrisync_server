import { Controller, Post } from '@nestjs/common';
import { RecommendationAgentSupabaseService } from '../supabase/recommendation-agent-supabase.service';

@Controller('test-ai-recommendations')
export class TestAiRecommendationsController {
  constructor(
    private recommendationAgentService: RecommendationAgentSupabaseService,
  ) {}

  @Post('generate')
  async generateRecommendations() {
    await this.recommendationAgentService.generateDailyRecommendations();
    return { success: true, message: 'Recommendations generation triggered' };
  }
}
