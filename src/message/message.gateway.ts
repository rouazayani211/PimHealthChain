import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, set to your Flutter app's domain or localhost for development
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;

      this.connectedClients.set(userId, client);
      client.data.userId = userId;

      console.log(`Client connected: ${userId}`);
      client.join(userId);
    } catch (error) {
      console.error('WebSocket connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedClients.delete(userId);
      console.log(`Client disconnected: ${userId}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() sendMessageDto: string,
  ) {
    const senderId = client.data.userId;
    const messageSent: SendMessageDto = JSON.parse(sendMessageDto);
    const messageCreated: CreateMessageDto = {
      recipientId: messageSent.recipientId,
      content: messageSent.content,
      senderId,
    };

    try {
      const message = await this.messageService.createMessage(messageCreated);
      const recipientSocket = this.connectedClients.get(messageSent.recipientId);
      this.server.to(messageSent.recipientId).emit('newMessage', message);
      client.emit('messageSent', message);
      console.log(`Message sent from ${senderId} to ${messageSent.recipientId}:`, message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('messageError', { error: error.message });
      return { error: error.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(data.roomId);
    return { success: true, roomId: data.roomId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    return { success: true, roomId: data.roomId };
  }
}