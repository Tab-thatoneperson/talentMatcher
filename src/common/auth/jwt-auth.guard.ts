import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger('JwtAuthGuard');

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      url: string;
      headers: Record<string, string>;
    }>();

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      this.logger.warn(`[GUARD] ${req.method} ${req.url} — NO Authorization header present`);
    } else {
      const parts = authHeader.split(' ');
      const scheme = parts[0];
      const rawToken = parts[1] ?? '';
      this.logger.log(
        `[GUARD] ${req.method} ${req.url} — scheme="${scheme}" token prefix="${rawToken.slice(0, 20)}..." length=${rawToken.length}`,
      );

      // Decode header + payload without verifying signature so we can log what's inside
      try {
        const [headerB64, payloadB64] = rawToken.split('.');
        const header = JSON.parse(Buffer.from(headerB64, 'base64').toString()) as { alg?: string };
        const payload = JSON.parse(
          Buffer.from(payloadB64, 'base64').toString(),
        ) as { sub?: string; role?: string; exp?: number };
        const expStr = payload.exp ? new Date(payload.exp * 1000).toISOString() : 'n/a';
        this.logger.log(
          `[GUARD] Token decoded — alg=${header.alg} sub=${payload.sub} role=${payload.role} exp=${expStr}`,
        );
      } catch {
        this.logger.warn(`[GUARD] Could not decode token — may be malformed`);
      }
    }

    return super.canActivate(ctx);
  }

  handleRequest<T>(
    err: Error,
    user: T,
    info: { message?: string },
    ctx: ExecutionContext,
    status?: unknown,
  ): T {
    if (err || !user) {
      const reason = info?.message ?? (err ? err.message : 'no user returned');
      this.logger.warn(`[GUARD] ❌ JWT REJECTED — reason: "${reason}"`);
      if (err) this.logger.warn(`[GUARD] Error detail: ${err.stack ?? err.message}`);
    } else {
      const u = user as { sub?: string; role?: string };
      this.logger.log(`[GUARD] ✅ JWT accepted — resolved user sub=${u.sub} role=${u.role}`);
    }
    return super.handleRequest(err, user, info, ctx, status);
  }
}
