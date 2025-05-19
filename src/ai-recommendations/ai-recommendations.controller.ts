import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiRecommendationsSupabaseService } from '../supabase/ai-recommendations-supabase.service';
import { Request } from 'express';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { AiRecommendationResponseDto } from './dto/ai-recommendation-response.dto';
import { UpdateAiRecommendationViewedDto } from './dto/update-ai-recommendation-viewed.dto';

@Controller('ai-recommendations')
export class AiRecommendationsController {
  constructor(
    private readonly aiRecommendationsSupabaseService: AiRecommendationsSupabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getRecommendations(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<AiRecommendationResponseDto[]> {
    const user = req.user as { userId: string; username: string };
    return this.aiRecommendationsSupabaseService.getRecommendationsForUser(
      accessToken,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('viewed')
  async updateRecommendationViewed(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() updateDto: UpdateAiRecommendationViewedDto,
  ): Promise<AiRecommendationResponseDto> {
    const user = req.user as { userId: string; username: string };
    return this.aiRecommendationsSupabaseService.updateRecommendationViewed(
      accessToken,
      user.userId,
      updateDto.id,
    );
  }
}
