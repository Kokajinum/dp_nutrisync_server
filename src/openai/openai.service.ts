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
              'Jsi odborný výživový poradce, který poskytuje personalizovaná doporučení na základě analýzy jídelníčku a profilu uživatele. ' +
              'Tvé odpovědi musí být vždy ve formátu čistého JSON objektu bez jakéhokoliv úvodního nebo závěrečného textu. ' +
              'Tvé doporučení musí být založeno na vědeckých poznatcích o výživě a fitness. ' +
              'Vždy odpovídej v češtině a přizpůsob svá doporučení cílům uživatele (hubnutí, nabírání svalů nebo udržování váhy). ' +
              'Tvé odpovědi musí být stručné, jasné a přímo použitelné. ' +
              'Nikdy nepřidávej žádné formátování markdown, kódové bloky nebo vysvětlující text - pouze čistý JSON objekt.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
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
