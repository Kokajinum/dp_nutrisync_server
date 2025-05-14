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
import { SupabaseService } from '../supabase/supabase.service';
import { DailyDiaryResponseDto } from './dto/daily-diary-response.dto';
import { CreateFoodDiaryEntryDto } from './dto/create-food-diary-entry.dto';
import { FoodDiaryEntryResponseDto } from './dto/food-diary-entry-response.dto';
import { Request } from 'express';
import { AuthToken } from '../common/decorators/auth-token.decorator';

@Controller('diary')
export class DiaryController {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    return this.supabaseService.getDailyDiary(accessToken, user.userId, date);
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

    return this.supabaseService.createFoodDiaryEntry(
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

    return this.supabaseService.deleteFoodDiaryEntry(
      accessToken,
      user.userId,
      entryId,
    );
  }
}
