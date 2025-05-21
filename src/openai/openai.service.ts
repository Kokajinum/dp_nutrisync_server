import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateCompletion(
    prompt: string,
    model: string = 'gpt-4o-mini',
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful nutrition and fitness assistant that provides personalized recommendations based on user data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error(
        `Error calling OpenAI API: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }
}
