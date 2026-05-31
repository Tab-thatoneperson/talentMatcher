import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  role: 'candidate' | 'employer';
  companyId?: string;
  isAdmin?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static readonly logger = new Logger('JwtStrategy');

  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET', 'change-me-in-production');
    JwtStrategy.logger.log(`[INIT] JwtStrategy initialised — secret starts with: "${secret.slice(0, 6)}..."`);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    JwtStrategy.logger.log(
      `[VALIDATE] ✅ Signature verified — resolving user: sub=${payload.sub} role=${payload.role} companyId=${payload.companyId ?? 'n/a'}`,
    );
    return payload;
  }
}
