import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BaseSupabaseService } from './base-supabase.service';
import { OpenAiService } from '../openai/openai.service';
import { NotificationsSupabaseService } from './notifications-supabase.service';
import { DiarySupabaseService } from './diary-supabase.service';
import { UsersSupabaseService } from './users-supabase.service';
import { AiRecommendationsSupabaseService } from './ai-recommendations-supabase.service';
import { PushTokensSupabaseService } from './push-tokens-supabase.service';
import { DailyDiaryResponseDto } from '../diary/dto/daily-diary-response.dto';
import { UserProfileResponseDto } from '../users/dto/user-profile-response.dto';
import { CreateAiRecommendationDto } from '../ai-recommendations/dto/create-ai-recommendation.dto';

@Injectable()
export class RecommendationAgentSupabaseService extends BaseSupabaseService {
  private readonly logger = new Logger(RecommendationAgentSupabaseService.name);
  private readonly PROMPT_VERSION = 1; // Increment this when you change the prompt structure

  constructor(
    protected configService: ConfigService,
    private openAiService: OpenAiService,
    private notificationsService: NotificationsSupabaseService,
    private diarySupabaseService: DiarySupabaseService,
    private usersSupabaseService: UsersSupabaseService,
    private aiRecommendationsSupabaseService: AiRecommendationsSupabaseService,
    private pushTokensSupabaseService: PushTokensSupabaseService,
  ) {
    super(configService);
  }

  @Cron('0 0 * * *') // Run at midnight every day
  async generateDailyRecommendations() {
    this.logger.log('Starting daily recommendations generation');

    try {
      // Get all users with profiles
      const users = await this.getAllUsers();

      for (const user of users) {
        await this.processUserRecommendation(user.userId);
      }

      this.logger.log('Daily recommendations generation completed');
    } catch (error) {
      this.logger.error(
        `Error in daily recommendations generation: ${error.message}`,
        error.stack,
      );
    }
  }

  async processUserRecommendation(userId: string) {
    try {
      this.logger.log(`Processing recommendation for user ${userId}`);

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get the user's diary for yesterday using service role key
      const diary = await this.diarySupabaseService.getDailyDiary(
        '',
        userId,
        yesterdayStr,
        true,
      );

      // If there are no food entries, skip this user
      if (!diary?.food_entries || diary.food_entries.length === 0) {
        this.logger.log(
          `No food entries for user ${userId} on ${yesterdayStr}, skipping`,
        );
        return;
      }

      // Create a client with service role key to get user profile
      const client = this.createClientForUser('', true);

      // Get the user profile directly since the service method doesn't support userId parameter
      const { data: userProfileData, error: profileError } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        this.logger.error(
          `Error fetching profile for user ${userId}: ${profileError.message}`,
        );
        return;
      }

      const userProfile = userProfileData as UserProfileResponseDto;

      // Build the prompt
      const prompt = this.buildPrompt(userProfile, diary);

      // Generate the recommendation using OpenAI
      const model = 'gpt-4o';
      const response = await this.openAiService.generateCompletion(
        prompt,
        model,
      );

      // Create recommendation data
      const recommendationData: CreateAiRecommendationDto = {
        user_id: userId,
        analyzed_date: yesterday,
        prompt_version: this.PROMPT_VERSION,
        prompt,
        response,
        model_used: model,
      };

      // Save the recommendation using service role key
      const savedRecommendation =
        await this.aiRecommendationsSupabaseService.createRecommendation(
          recommendationData,
        );

      // Send a push notification
      await this.notificationsService.sendPushNotification(
        userId,
        'Nové doporučení k dispozici',
        'Podívejte se na své nové nutriční doporučení na základě včerejšího jídelníčku.',
        { recommendationId: savedRecommendation.id },
      );

      this.logger.log(
        `Recommendation processed successfully for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing recommendation for user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private buildPrompt(
    userProfile: UserProfileResponseDto,
    diary: DailyDiaryResponseDto,
  ): string {
    // Extract user information
    const gender = userProfile.gender;
    const currentWeight = userProfile.weight_value;
    const targetWeight = userProfile.target_weight_value;
    const goal = userProfile.goal;

    // Extract diary information
    const caloriesConsumed = diary.calories_consumed;
    const proteinConsumed = diary.protein_consumed_g;
    const carbsConsumed = diary.carbs_consumed_g;
    const fatConsumed = diary.fat_consumed_g;

    // Calculate macronutrient percentages
    const totalMacros = proteinConsumed + carbsConsumed + fatConsumed;
    const proteinPercentage =
      totalMacros > 0 ? Math.round((proteinConsumed / totalMacros) * 100) : 0;
    const carbsPercentage =
      totalMacros > 0 ? Math.round((carbsConsumed / totalMacros) * 100) : 0;
    const fatPercentage =
      totalMacros > 0 ? Math.round((fatConsumed / totalMacros) * 100) : 0;

    // Format food entries
    const foodEntries = (diary.food_entries || [])
      .map((entry) => {
        return `- ${entry.food_name} (${entry.meal_type}): ${entry.calories} kcal, ${entry.protein}g bílkovin, ${entry.carbs}g sacharidů, ${entry.fat}g tuků`;
      })
      .join('\n');

    // Build the prompt
    return `
Uživatel: ${gender === 'male' ? 'muž' : gender === 'female' ? 'žena' : 'osoba'}, ${currentWeight} kg, cíl ${goal === 'lose_fat' ? 'zhubnout' : goal === 'gain_muscle' ? 'nabrat svaly' : 'udržet váhu'} na ${targetWeight} kg.

Včerejší jídelníček:
Celkem: ${caloriesConsumed} kcal, ${proteinConsumed}g bílkovin (${proteinPercentage}%), ${carbsConsumed}g sacharidů (${carbsPercentage}%), ${fatConsumed}g tuků (${fatPercentage}%)

Seznam jídel:
${foodEntries}

Prosím, poskytni personalizované doporučení na základě těchto dat. Odpověz POUZE čistým JSON objektem bez jakéhokoliv formátování markdown nebo vysvětlujícího textu. JSON objekt musí obsahovat následující klíče:

{
  "summary": "Stručné shrnutí včerejšího jídelníčku",
  "positives": [
    "Co dělá uživatel dobře - bod 1",
    "Co dělá uživatel dobře - bod 2"
  ],
  "improvements": [
    "Doporučení ke zlepšení - bod 1"
  ],
  "motivation": "Motivační zpráva pro uživatele"
}

Odpověď musí být v češtině a obsahovat POUZE validní JSON objekt bez jakéhokoliv úvodního nebo závěrečného textu.
`;
  }

  private async getAllUsers(): Promise<Array<{ userId: string }>> {
    try {
      // Get all user IDs with push tokens using the existing service
      const userIds =
        await this.pushTokensSupabaseService.getAllUserIdsWithPushTokens();

      // Map to the expected format
      return userIds.map((userId) => ({ userId }));
    } catch (error) {
      this.logger.error(`Error in getAllUsers: ${error.message}`, error.stack);
      return [];
    }
  }
}
