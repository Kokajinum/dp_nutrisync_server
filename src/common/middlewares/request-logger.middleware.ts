import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response, Request } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, body, query, params } = req;

    // Log request details
    this.logger.log(`Request: [${method}] ${originalUrl} - IP: ${ip}`);

    // Capture the original response.end to intercept it
    const originalEnd = res.end;
    let responseBody: any;

    // Override res.end method to capture response body
    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        responseBody = chunk.toString();
      }
      return originalEnd.call(this, chunk, ...args);
    };

    res.on('finish', () => {
      const elapsedTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Create a detailed log object
      const logData = {
        timestamp: new Date().toISOString(),
        method,
        url: originalUrl,
        statusCode,
        elapsedTime: `${elapsedTime}ms`,
        ip,
        userAgent: req.get('user-agent') || 'unknown',
        requestBody: this.sanitizeData(body),
        requestQuery: query,
        requestParams: params,
      };

      if (statusCode < 400) {
        this.logger.log(
          `Response: [${method}] ${originalUrl} - ${statusCode} - ${elapsedTime}ms`,
          logData,
        );
      } else {
        // For error responses, try to parse the response body to get error details
        let errorMessage = 'Unknown error';
        try {
          if (responseBody) {
            const parsedBody = JSON.parse(responseBody);
            errorMessage =
              parsedBody.message || parsedBody.error || 'Unknown error';
          }
        } catch (e) {
          // If parsing fails, use the raw response body or a default message
          errorMessage = responseBody || 'Unknown error';
        }

        // Add error message to log data
        logData['errorMessage'] = errorMessage;

        this.logger.warn(
          `Error: [${method}] ${originalUrl} - ${statusCode} - ${errorMessage}`,
          logData,
        );
      }
    });

    next();
  }

  // Sanitize sensitive data before logging
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // List of fields to sanitize
    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'secret',
      'apiKey',
    ];

    // Recursively sanitize objects
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach((key) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = 'REDACTED';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }
}
