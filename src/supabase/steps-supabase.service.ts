import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSupabaseService } from './base-supabase.service';
import { StepMeasurementResponseDto } from 'src/steps/dto/step-measurement-response.dto';
import { CreateStepMeasurementDto } from 'src/steps/dto/create-step-measurement.dto';

@Injectable()
export class StepsSupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  async createStepMeasurement(
    accessToken: string,
    userId: string,
    stepData: CreateStepMeasurementDto,
  ): Promise<StepMeasurementResponseDto> {
    const client = this.createClientForUser(accessToken);
    const payload = {
      user_id: userId,
      ...stepData,
    };

    const { data, error } = await client
      .from('step_measurements')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error while creating step measurement: ${error.message}`,
      );
    }

    return data;
  }

  async getStepMeasurementsForLastDays(
    accessToken: string,
    userId: string,
    days: number,
  ): Promise<StepMeasurementResponseDto[]> {
    const client = this.createClientForUser(accessToken);

    // Calculate date from X days ago
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await client
      .from('step_measurements')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', fromDate.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching step measurements: ${error.message}`,
      );
    }

    return data || [];
  }

  async getAllStepMeasurements(
    accessToken: string,
    userId: string,
  ): Promise<StepMeasurementResponseDto[]> {
    const client = this.createClientForUser(accessToken);

    const { data, error } = await client
      .from('step_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching all step measurements: ${error.message}`,
      );
    }

    return data || [];
  }
}
