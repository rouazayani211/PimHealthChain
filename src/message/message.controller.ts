import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessageService } from './message.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversation/:otherUserId')
  async getConversation(@Request() req, @Param('otherUserId') otherUserId: string) {
    const userId = req.user.userId;
    return this.messageService.getMessagesBetweenUsers(userId, otherUserId);
  }

  @Get('unread')
  async getUnreadMessages(@Request() req) {
    const userId = req.user.userId;
    return this.messageService.getUnreadMessages(userId);
  }

  @Post('mark-read')
  async markMessageAsRead(@Body() markReadDto: MarkReadDto) {
    return this.messageService.markAsRead(markReadDto.messageId);
  }

  @Get('conversations')
  async getRecentConversations(@Request() req) {
    const userId = req.user.userId;
    return this.messageService.getRecentConversations(userId);
  }

  @Post('send')
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user.userId;
    const createMessageDto = {
      senderId: userId,
      recipientId: sendMessageDto.recipientId,
      content: sendMessageDto.content,
    };
    return this.messageService.createMessage(createMessageDto);
  }
}