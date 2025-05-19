import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StepsSupabaseService } from '../supabase/steps-supabase.service';
import { Request } from 'express';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';
import { CreateStepMeasurementDto } from './dto/create-step-measurement.dto';
import { StepMeasurementResponseDto } from './dto/step-measurement-response.dto';

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsSupabaseService: StepsSupabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createStepMeasurement(
    @Req() req: Request,
    @AuthToken() accessToken: string,
    @Body() createStepDto: CreateStepMeasurementDto,
  ): Promise<StepMeasurementResponseDto> {
    const user = req.user as { userId: string; username: string };
    return this.stepsSupabaseService.createStepMeasurement(
      accessToken,
      user.userId,
      createStepDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('last7days')
  async getLast7DaysSteps(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<StepMeasurementResponseDto[]> {
    const user = req.user as { userId: string; username: string };
    return this.stepsSupabaseService.getStepMeasurementsForLastDays(
      accessToken,
      user.userId,
      7,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('last30days')
  async getLast30DaysSteps(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<StepMeasurementResponseDto[]> {
    const user = req.user as { userId: string; username: string };
    return this.stepsSupabaseService.getStepMeasurementsForLastDays(
      accessToken,
      user.userId,
      30,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllSteps(
    @Req() req: Request,
    @AuthToken() accessToken: string,
  ): Promise<StepMeasurementResponseDto[]> {
    const user = req.user as { userId: string; username: string };
    return this.stepsSupabaseService.getAllStepMeasurements(
      accessToken,
      user.userId,
    );
  }
}
