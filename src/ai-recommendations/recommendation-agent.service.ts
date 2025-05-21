import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from '../openai/openai.service';
import { NotificationsSupabaseService } from '../supabase/notifications-supabase.service';
import { DiarySupabaseService } from '../supabase/diary-supabase.service';
import { UsersSupabaseService } from '../supabase/users-supabase.service';
import { AiRecommendationsSupabaseService } from '../supabase/ai-recommendations-supabase.service';
import { DailyDiaryResponseDto } from '../diary/dto/daily-diary-response.dto';
import { UserProfileResponseDto } from '../users/dto/user-profile-response.dto';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';

@Injectable()
export class RecommendationAgentService {
  private readonly logger = new Logger(RecommendationAgentService.name);
  private readonly PROMPT_VERSION = 1; // Increment this when you change the prompt structure

  constructor(
    private configService: ConfigService,
    private openAiService: OpenAiService,
    private notificationsService: NotificationsSupabaseService,
    private diarySupabaseService: DiarySupabaseService,
    private usersSupabaseService: UsersSupabaseService,
    private aiRecommendationsSupabaseService: AiRecommendationsSupabaseService,
  ) {}

  @Cron('0 0 * * *') // Run at midnight every day
  async generateDailyRecommendations() {
    this.logger.log('Starting daily recommendations generation');

    try {
      // Get all users with profiles
      // This is a placeholder - you'll need to implement the actual logic to get all users
      const users = await this.getAllUsers();

      for (const user of users) {
        await this.processUserRecommendation(user.userId, user.accessToken);
      }

      this.logger.log('Daily recommendations generation completed');
    } catch (error) {
      this.logger.error(
        `Error in daily recommendations generation: ${error.message}`,
        error.stack,
      );
    }
  }

  async processUserRecommendation(userId: string, accessToken: string) {
    try {
      this.logger.log(`Processing recommendation for user ${userId}`);

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get the user's diary for yesterday
      const diary = await this.diarySupabaseService.getDailyDiary(
        accessToken,
        userId,
        yesterdayStr,
      );

      // If there are no food entries, skip this user
      if (!diary.food_entries || diary.food_entries.length === 0) {
        this.logger.log(
          `No food entries for user ${userId} on ${yesterdayStr}, skipping`,
        );
        return;
      }

      // Get the user profile
      const userProfile =
        await this.usersSupabaseService.getUserProfile(accessToken);

      // Build the prompt
      const prompt = this.buildPrompt(userProfile, diary);

      // Generate the recommendation using OpenAI
      const model = 'gpt-4o-mini';
      const response = await this.openAiService.generateCompletion(
        prompt,
        model,
      );

      // Save the recommendation to the database
      const recommendationData: CreateAiRecommendationDto = {
        user_id: userId,
        analyzed_date: yesterday,
        prompt_version: this.PROMPT_VERSION,
        prompt,
        response,
        model_used: model,
      };

      const savedRecommendation =
        await this.aiRecommendationsSupabaseService.createRecommendation(
          accessToken,
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

Prosím, poskytni personalizované doporučení na základě těchto dat. Odpověz ve formátu JSON s následujícími klíči:
1. "summary": Stručné shrnutí včerejšího jídelníčku
2. "positives": Co dělá uživatel dobře (alespoň 2-3 body)
3. "improvements": Doporučení ke zlepšení (alespoň 2-3 body)
4. "motivation": Motivační zpráva pro uživatele

Odpověď musí být v češtině a ve formátu JSON.
`;
  }

  private async getAllUsers(): Promise<
    Array<{ userId: string; accessToken: string }>
  > {
    try {
      // Get service_role key for access to all users
      const serviceRoleKey = this.configService.get<string>(
        'SUPABASE_SERVICE_ROLE_KEY',
      );

      if (!serviceRoleKey) {
        this.logger.error('Missing SUPABASE_SERVICE_ROLE_KEY configuration');
        return [];
      }

      // Create a client with service_role key
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

      if (!supabaseUrl) {
        this.logger.error('Missing SUPABASE_URL configuration');
        return [];
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Get all users who have profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id');

      if (profilesError) {
        this.logger.error(
          `Error fetching user profiles: ${profilesError.message}`,
        );
        return [];
      }

      // For each user, create an access token
      const result: Array<{ userId: string; accessToken: string }> = [];

      for (const profile of profiles) {
        try {
          // Create a JWT token for the user
          // This is a simplified example - in a real implementation, you would use the proper way to generate tokens
          const {
            data: { session },
            error: authError,
          } = await supabase.auth.admin.createSession({
            user_id: profile.user_id,
          });

          if (authError) {
            this.logger.error(
              `Error creating session for user ${profile.user_id}: ${authError.message}`,
            );
            continue;
          }

          result.push({
            userId: profile.user_id,
            accessToken: session.access_token,
          });
        } catch (userError) {
          this.logger.error(
            `Error processing user ${profile.user_id}: ${userError.message}`,
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error in getAllUsers: ${error.message}`, error.stack);
      return [];
    }
  }
}
