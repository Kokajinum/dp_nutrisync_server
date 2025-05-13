import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { FoodResponseDto } from './dto/food-response.dto';
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
}
