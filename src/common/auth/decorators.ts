import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import type { JwtPayload } from './jwt.strategy';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user,
);

export const JwtAuth = (...roles: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    ...(roles.length ? [Roles(...roles)] : []),
  );
