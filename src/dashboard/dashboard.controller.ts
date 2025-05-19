import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { UsersSupabaseService } from '../supabase/users-supabase.service';
import { DiarySupabaseService } from '../supabase/diary-supabase.service';
import { StepsSupabaseService } from '../supabase/steps-supabase.service';
import { AiRecommendationsSupabaseService } from '../supabase/ai-recommendations-supabase.service';
import { FoodDiaryEntryResponseDto } from 'src/diary/dto/food-diary-entry-response.dto';
import { ActivityDiaryEntryResponseDto } from 'src/diary/dto/activity-diary-entry-response.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly usersSupabaseService: UsersSupabaseService,
    private readonly diarySupabaseService: DiarySupabaseService,
    private readonly stepsSupabaseService: StepsSupabaseService,
    private readonly aiRecommendationsSupabaseService: AiRecommendationsSupabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDashboardData(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<DashboardResponseDto> {
    const user = req.user as { userId: string; username: string };

    // Paralelní získání všech dat pro lepší výkon
    const [
      weightHistory7Days,
      weightHistory30Days,
      stepsHistory7Days,
      stepsHistory30Days,
      aiRecommendations,
      recentFoodEntries,
      recentActivityEntries,
    ] = await Promise.all([
      this.usersSupabaseService.getUserWeightHistoryLast7Days(
        accessToken,
        user.userId,
      ),
      this.usersSupabaseService.getUserWeightHistoryLast30Days(
        accessToken,
        user.userId,
      ),
      this.stepsSupabaseService.getStepMeasurementsForLastDays(
        accessToken,
        user.userId,
        7,
      ),
      this.stepsSupabaseService.getStepMeasurementsForLastDays(
        accessToken,
        user.userId,
        30,
      ),
      this.aiRecommendationsSupabaseService.getRecommendationsForUser(
        accessToken,
        user.userId,
      ),
      this.diarySupabaseService.getRecentFoodEntries(
        accessToken,
        user.userId,
        3,
      ),
      this.diarySupabaseService.getRecentActivityEntries(
        accessToken,
        user.userId,
        3,
      ),
    ]);

    return {
      recent_food_entries: recentFoodEntries,
      recent_activity_entries: recentActivityEntries,
      weight_history_7days: weightHistory7Days,
      weight_history_30days: weightHistory30Days,
      steps_history_7days: stepsHistory7Days,
      steps_history_30days: stepsHistory30Days,
      ai_recommendations: aiRecommendations,
    };
  }
}
