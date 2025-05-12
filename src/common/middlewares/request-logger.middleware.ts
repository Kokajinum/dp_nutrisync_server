import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response, Request } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger();

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    this.logger.log(`request: [${req.method}] ${req.url}`);

    res.on('finish', () => {
      const elapsedTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      if (statusCode < 400) {
        this.logger.log(
          `response: [${req.method} ${req.url} - ${statusCode}}]`,
        );
      } else {
        this.logger.warn(`[${req.method}] ${req.url} - ${statusCode}`);
      }
    });

    next();
  }
}
