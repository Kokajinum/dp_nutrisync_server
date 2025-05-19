import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiarySupabaseService } from '../supabase/diary-supabase.service';
import { DailyDiaryResponseDto } from './dto/daily-diary-response.dto';
import { CreateFoodDiaryEntryDto } from './dto/create-food-diary-entry.dto';
import { FoodDiaryEntryResponseDto } from './dto/food-diary-entry-response.dto';
import { ActivityDiaryResponseDto } from './dto/activity-diary-response.dto';
import { CreateActivityDiaryDto } from './dto/create-activity-diary.dto';
import { Request } from 'express';
import { AuthToken } from '../common/decorators/auth-token.decorator';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diarySupabaseService: DiarySupabaseService) {}

  // Activity Diary Endpoints
  @UseGuards(JwtAuthGuard)
  @Get('activity/date')
  async getActivityDiaryByDate(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Query('date') date: string,
  ): Promise<ActivityDiaryResponseDto | null> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.getActivityDiaryByDate(
      accessToken,
      user.userId,
      date,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity/:id')
  async getActivityDiary(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Param('id') diaryId: string,
  ): Promise<ActivityDiaryResponseDto> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.getActivityDiary(
      accessToken,
      user.userId,
      diaryId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity')
  async getAllActivityDiaries(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<ActivityDiaryResponseDto[]> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.getAllActivityDiaries(
      accessToken,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('activity')
  async saveActivityDiary(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() createActivityDiaryDto: CreateActivityDiaryDto,
  ): Promise<ActivityDiaryResponseDto> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.saveActivityDiary(
      accessToken,
      user.userId,
      createActivityDiaryDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDailyDiary(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Query('date') date: string,
  ): Promise<DailyDiaryResponseDto> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.getDailyDiary(
      accessToken,
      user.userId,
      date,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('entries')
  async createFoodDiaryEntry(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() createFoodDiaryEntryDto: CreateFoodDiaryEntryDto,
  ): Promise<FoodDiaryEntryResponseDto> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.createFoodDiaryEntry(
      accessToken,
      user.userId,
      createFoodDiaryEntryDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('entries/:id')
  async deleteFoodDiaryEntry(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Param('id') entryId: string,
  ): Promise<{ success: boolean }> {
    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.diarySupabaseService.deleteFoodDiaryEntry(
      accessToken,
      user.userId,
      entryId,
    );
  }
}
