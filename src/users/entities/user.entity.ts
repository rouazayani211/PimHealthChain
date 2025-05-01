import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['patient', 'admin', 'doctor'] })
  role: string;

  @Prop()
  photo: string;

  @Prop()
  otp: string; // Store OTP

  @Prop()
  otpExpires: Date; // OTP expiration time
}

export const UserSchema = SchemaFactory.createForClass(User);