import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-fallback-secret-key',
    });
    console.log('JwtStrategy initialized with secret:', process.env.JWT_SECRET || 'your-fallback-secret-key');
  }

  async validate(payload: any) {
    console.log('JWT payload validated:', payload);
    return { userId: payload.sub, email: payload.email };
  }
}