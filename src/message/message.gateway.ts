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
    origin: '*', // In production, set to your Flutter app's domain
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
        console.log('Connection attempt without token');
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
      client.emit('error', error.message);
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start_call')
  handleStartCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string; callerName: string; recipientId: string; recipientName: string; callType: string },
  ) {
    if (!data.callId || !data.callerId || !data.recipientId) {
      console.error('Missing required fields in start_call event');
      client.emit('error', { message: 'Missing required fields' });
      return;
    }

    const recipientSocket = this.connectedClients.get(data.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('incoming_call', {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        recipientId: data.recipientId,
        recipientName: data.recipientName,
        callType: data.callType,
      });
      console.log(`Call initiated from ${data.callerId} to ${data.recipientId}`);
    } else {
      client.emit('call_rejected', {
        callId: data.callId,
        userId: data.recipientId,
      });
      console.log(`Recipient ${data.recipientId} not online`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('accept_call')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string; recipientId: string },
  ) {
    if (!data.callId || !data.callerId || !data.recipientId) {
      console.error('Missing required fields in accept_call event');
      client.emit('error', { message: 'Missing required fields' });
      return;
    }

    const callerSocket = this.connectedClients.get(data.callerId);
    if (callerSocket) {
      callerSocket.emit('call_accepted', { callId: data.callId, callerId: data.callerId, recipientId: data.recipientId });
      console.log(`Call ${data.callId} accepted by ${data.recipientId}`);
    } else {
      client.emit('error', { message: 'Caller not online' });
      console.log(`Caller ${data.callerId} not online`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('reject_call')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; userId: string; callerId?: string; recipientId?: string },
  ) {
    if (!data.callId || !data.userId) {
      console.error('Missing required fields in reject_call event');
      client.emit('error', { message: 'Missing required fields' });
      return;
    }

    const callData = {
      callId: data.callId,
      userId: data.userId,
      callerId: data.callerId,
      recipientId: data.recipientId,
    };

    // Notify the caller (if the rejector is the recipient)
    if (data.callerId) {
      const callerSocket = this.connectedClients.get(data.callerId);
      if (callerSocket) {
        callerSocket.emit('call_rejected', callData);
        console.log(`Call ${data.callId} rejected by ${data.userId}`);
      } else {
        console.log(`Caller ${data.callerId} not online`);
      }
    }

    // Notify the recipient (if the rejector is the caller)
    if (data.recipientId) {
      const recipientSocket = this.connectedClients.get(data.recipientId);
      if (recipientSocket) {
        recipientSocket.emit('call_rejected', callData);
        console.log(`Call ${data.callId} rejected by ${data.userId}`);
      } else {
        console.log(`Recipient ${data.recipientId} not online`);
      }
    }
  }
}