import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseClientFactory {
  private readonly supabaseUrl: string | undefined;
  private readonly supabaseKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new InternalServerErrorException(
        'Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_KEY.'
      );
    }
  }

  createClientForUser(accessToken: string): SupabaseClient {

    if (!this.supabaseUrl || !this.supabaseKey) {
        throw new InternalServerErrorException(
          'Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_KEY.'
        );
      }

    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
}