import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const url = req.url;
    const method = req.method;
    const whiteList = [
      { method: 'POST', path: '/user/login' },
      { method: 'POST', path: '/user/register' },
    ];
    const isWhiteListed = whiteList.some(
      (item) => item.method === method && url.startsWith(item.path),
    );
    if (isWhiteListed) return true;
    return super.canActivate(context);
  }
}
