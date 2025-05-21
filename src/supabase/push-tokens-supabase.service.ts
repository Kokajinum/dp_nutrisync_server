import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSupabaseService } from './base-supabase.service';
import { createClient } from '@supabase/supabase-js';

interface PushTokenData {
  user_id: string;
  push_token: string;
  device_id?: string;
  device_name?: string;
}

@Injectable()
export class PushTokensSupabaseService extends BaseSupabaseService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  async savePushToken(accessToken: string, data: PushTokenData): Promise<any> {
    const client = this.createClientForUser(accessToken);

    // If device_id exists, update existing record or insert new one
    if (data.device_id) {
      const { data: existingToken, error: fetchError } = await client
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', data.user_id)
        .eq('device_id', data.device_id)
        .maybeSingle();

      if (fetchError) {
        throw new InternalServerErrorException(
          `Error while fetching push token: ${fetchError.message}`,
        );
      }

      if (existingToken) {
        // Update existing token
        const { data: updatedToken, error: updateError } = await client
          .from('user_push_tokens')
          .update({
            push_token: data.push_token,
            device_name: data.device_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id)
          .select()
          .single();

        if (updateError) {
          throw new InternalServerErrorException(
            `Error while updating push token: ${updateError.message}`,
          );
        }

        return updatedToken;
      }
    }

    // Insert new token
    const { data: newToken, error: insertError } = await client
      .from('user_push_tokens')
      .insert({
        user_id: data.user_id,
        push_token: data.push_token,
        device_id: data.device_id,
        device_name: data.device_name,
      })
      .select()
      .single();

    if (insertError) {
      throw new InternalServerErrorException(
        `Error while saving push token: ${insertError.message}`,
      );
    }

    return newToken;
  }

  async getUserPushTokens(
    accessToken: string,
    userId: string,
  ): Promise<string[]> {
    const client = this.createClientForUser(accessToken);
    const { data, error } = await client
      .from('user_push_tokens')
      .select('push_token')
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching push tokens: ${error.message}`,
      );
    }

    return data.map((item) => item.push_token);
  }

  async deletePushToken(
    accessToken: string,
    userId: string,
    pushToken: string,
  ): Promise<void> {
    const client = this.createClientForUser(accessToken);
    const { error } = await client
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('push_token', pushToken);

    if (error) {
      throw new InternalServerErrorException(
        `Error while deleting push token: ${error.message}`,
      );
    }
  }

  async getAllUserIdsWithPushTokens(): Promise<string[]> {
    // This method will be used in RecommendationAgentSupabaseService
    // We use service_role key to access all users
    const client = this.createClientForUser('', true); // Using service role

    const { data, error } = await client
      .from('user_push_tokens')
      .select('user_id')
      .limit(1000); // Limit to a reasonable number

    if (error) {
      throw new InternalServerErrorException(
        `Error while fetching users with push tokens: ${error.message}`,
      );
    }

    // Filter out duplicate user_ids
    const uniqueUserIds = [...new Set(data.map((item) => item.user_id))];
    return uniqueUserIds;
  }
}
