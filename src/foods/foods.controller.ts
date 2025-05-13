import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { FoodResponseDto } from './dto/food-response.dto';
import {
  SearchFoodQueryDto,
  SearchFoodResponseDto,
} from './dto/search-food.dto';
import { Request } from 'express';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';

@Controller('foods')
export class FoodsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createFood(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() createFoodDto: CreateFoodDto,
    @Headers('Accept-Language') lang: string,
  ): Promise<FoodResponseDto> {
    if (!lang) {
      throw new BadRequestException('Language header is required');
    }

    const user = req.user as {
      userId: string;
      username: string;
      email: string;
    };

    return this.supabaseService.createFood(
      accessToken,
      user.userId,
      createFoodDto,
      lang,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchFoods(
    @AuthToken() accessToken: string,
    @Query() searchQuery: SearchFoodQueryDto,
    @Headers('Accept-Language') lang: string,
  ): Promise<SearchFoodResponseDto> {
    if (!lang) {
      throw new BadRequestException('Language header is required');
    }

    const { page = 1, limit = 10, query = '' } = searchQuery;

    return this.supabaseService.searchFoods(
      accessToken,
      page,
      limit,
      query,
      lang,
    );
  }
}
