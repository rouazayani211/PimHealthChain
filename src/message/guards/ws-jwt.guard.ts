import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        throw new WsException('Unauthorized access');
      }

      const payload = this.jwtService.verify(token as string);
      client.data.userId = payload.sub;
      return true;
    } catch (error) {
      throw new WsException('Unauthorized access');
    }
  }
}