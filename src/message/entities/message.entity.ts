import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipientId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  sentAt: Date;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);