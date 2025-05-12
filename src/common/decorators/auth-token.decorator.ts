import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export const AuthToken = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedException('Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid token format');
  }

  return token;
});