import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get status code and error message
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message and stack trace
    let errorMessage = 'Internal server error';
    let errorStack = 'No stack trace available';
    let errorResponse: any;

    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse();
      errorMessage =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse.message as string) || 'Internal server error';
      errorStack = exception.stack || 'No stack trace available';
    } else if (exception instanceof Error) {
      errorMessage = exception.message || 'Unknown error';
      errorStack = exception.stack || 'No stack trace available';
    }

    // Create a detailed log entry
    const logData = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      errorMessage: errorMessage,
      body: request.body,
      params: request.params,
      query: request.query,
      headers: this.sanitizeHeaders(request.headers),
      stack: errorStack,
    };

    // Log the error with detailed information
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} - ${errorMessage}`,
      logData,
    );

    // Send the response to the client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }

  // Remove sensitive information from headers
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers
    if (sanitized.authorization) {
      sanitized.authorization = 'REDACTED';
    }
    if (sanitized.cookie) {
      sanitized.cookie = 'REDACTED';
    }

    return sanitized;
  }
}
