import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { BaseSupabaseService } from './base-supabase.service';

@Injectable()
export class NotificationsSupabaseService extends BaseSupabaseService {
  private readonly logger = new Logger(NotificationsSupabaseService.name);
  private readonly expo: Expo;

  constructor(protected configService: ConfigService) {
    super(configService);
    this.expo = new Expo();
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    try {
      // Get the user's push tokens from the database
      const pushTokens = await this.getUserPushTokens(userId);

      if (!pushTokens || pushTokens.length === 0) {
        this.logger.warn(`No push tokens found for user ${userId}`);
        return;
      }

      // Prepare messages for each token
      const messages: ExpoPushMessage[] = [];

      for (const pushToken of pushTokens) {
        // Check if the push token is valid
        if (!Expo.isExpoPushToken(pushToken)) {
          this.logger.error(
            `Push token ${pushToken} is not a valid Expo push token`,
          );
          continue;
        }

        // Create the message
        messages.push({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data,
        });
      }

      if (messages.length === 0) {
        this.logger.warn(`No valid push tokens for user ${userId}`);
        return;
      }

      // Send the messages
      const chunks = this.expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

          for (let i = 0; i < ticketChunk.length; i++) {
            const ticket = ticketChunk[i];
            const token = chunk[i].to;

            if (ticket.status === 'error') {
              this.logger.error(
                `Error sending push notification: ${ticket.message}`,
              );
              if (ticket.details && ticket.details.error) {
                this.logger.error(`Error details: ${ticket.details.error}`);

                // Handle invalid tokens
                if (
                  ticket.details.error === 'DeviceNotRegistered' ||
                  ticket.details.error === 'InvalidCredentials'
                ) {
                  // TODO: Remove invalid token from database
                  this.logger.warn(`Should remove invalid token: ${token}`);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `Error sending push notification chunk: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(`Push notifications sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
    }
  }

  async getUserPushTokens(userId: string): Promise<string[]> {
    try {
      // Use service_role key for access to tokens
      const client = this.createClientForUser('', true); // Using service role

      const { data, error } = await client
        .from('user_push_tokens')
        .select('push_token')
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error fetching push tokens: ${error.message}`);
        return [];
      }

      return data.map((item) => item.push_token);
    } catch (error) {
      this.logger.error(
        `Error in getUserPushTokens: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  // Method for registering a push token
  async registerPushToken(
    userId: string,
    pushToken: string,
    deviceId?: string,
    deviceName?: string,
  ): Promise<void> {
    try {
      // Use service_role key for access
      const client = this.createClientForUser('', true); // Using service role

      // If we have device_id, check if a record already exists
      if (deviceId) {
        const { data: existingToken } = await client
          .from('user_push_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .maybeSingle();

        if (existingToken) {
          // Update existing token
          await client
            .from('user_push_tokens')
            .update({
              push_token: pushToken,
              device_name: deviceName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingToken.id);

          this.logger.log(
            `Updated push token for user ${userId} and device ${deviceId}`,
          );
          return;
        }
      }

      // Insert new token
      await client.from('user_push_tokens').insert({
        user_id: userId,
        push_token: pushToken,
        device_id: deviceId,
        device_name: deviceName,
      });

      this.logger.log(`Registered new push token for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error registering push token: ${error.message}`,
        error.stack,
      );
    }
  }
}
