// // Add crypto.randomUUID polyfill if not available
// if (
//   typeof global.crypto === 'undefined' ||
//   typeof global.crypto.randomUUID === 'undefined'
// ) {
//   const nodeCrypto = require('crypto');
//   // Instead of trying to implement the full Crypto interface,
//   // we'll just add the randomUUID function which is what @nestjs/schedule needs
//   global.crypto = global.crypto || {};
//   global.crypto.randomUUID = () => nodeCrypto.randomUUID();
// }

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.Console({
          format: format.combine(
            format.cli(),
            format.splat(),
            format.timestamp(),
            format.printf((info) => {
              return `${info.timestamp} ${info.level} ${info.message}`;
            }),
          ),
        }),
      ],
    }),
  });

  // Apply global exception filter for catching and logging unhandled exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  //automaticka globalni validace
  //whitelist: true
  //Tato volba automaticky odstraní všechny vlastnosti, které nejsou definované v DTO
  //forbidNonWhitelisted: true
  //Tato volba zajistí, že pokud klient odešle data, která nejsou v DTO povolená, místo tichého odstranění těchto polí se vyhodí výjimka.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Enable automatic transformation
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
