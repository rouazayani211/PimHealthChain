import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
  ) {}

  async getOrCreateConversation(senderId: string, recipientId: string): Promise<Conversation> {
    const participants = [senderId, recipientId].sort();
    let conversation = await this.conversationModel.findOne({
      participants: { $all: participants, $size: participants.length },
    }).exec();

    if (!conversation) {
      conversation = new this.conversationModel({
        participants,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }

    return conversation;
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      console.log('Attempting to create message with data:', createMessageDto);
      
      const sender = await this.userModel.findById(createMessageDto.senderId).exec();
      console.log('Sender lookup result:', sender ? 'Found' : 'Not found');
      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      const recipient = await this.userModel.findById(new Types.ObjectId(createMessageDto.recipientId)).exec();
      console.log('Recipient lookup result:', recipient ? 'Found' : 'Not found');
      if (!recipient) {
        throw new NotFoundException('Recipient not found');
      }

      const conversation = await this.getOrCreateConversation(createMessageDto.senderId, createMessageDto.recipientId);
      
      const createdMessage = new this.messageModel({
        ...createMessageDto,
        conversationId: conversation._id,
        sentAt: new Date(),
        isRead: false,
      });

      console.log('Attempting to save message:', createdMessage);
      const savedMessage = await createdMessage.save();
      console.log('Message saved successfully:', savedMessage);

      // Update conversation's updatedAt, lastMessage, and lastMessageAt
      await this.conversationModel.findByIdAndUpdate(conversation._id, { 
        updatedAt: new Date(),
        lastMessage: savedMessage._id,
        lastMessageAt: savedMessage.sentAt,
      }).exec();

      return savedMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesBetweenUsers(userId: string, otherUserId: string): Promise<Message[]> {
    try {
      const conversation = await this.getOrCreateConversation(userId, otherUserId);
      return this.messageModel.find({
        conversationId: conversation._id,
      })
      .sort({ sentAt: 1 })
      .exec();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    try {
      return this.messageModel.find({
        recipientId: userId,
        isRead: false,
      })
      .sort({ sentAt: -1 })
      .exec();
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<Message> {
    try {
      const message = await this.messageModel.findById(messageId).exec();
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      message.isRead = true;
      message.readAt = new Date();
      return await message.save();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getRecentConversations(userId: string): Promise<any[]> {
    try {
      const conversations = await this.conversationModel.aggregate([
        {
          $match: {
            participants: new Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'messages',
            localField: 'lastMessage',
            foreignField: '_id',
            as: 'lastMessage',
          },
        },
        {
          $unwind: {
            path: '$lastMessage',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'users',
            let: { participants: '$participants' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$_id', '$$participants'] },
                      { $ne: ['$_id', new Types.ObjectId(userId)] },
                    ],
                  },
                },
              },
            ],
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $sort: {
            lastMessageAt: -1,
          },
        },
        {
          $project: {
            _id: 1,
            lastMessage: 1,
            user: {
              _id: 1,
              name: 1,
              email: 1,
            },
          },
        },
      ]);

      return conversations;
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      throw error;
    }
  }
}