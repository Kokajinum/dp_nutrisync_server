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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.File({
          filename: `logs/combined.log`,
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
