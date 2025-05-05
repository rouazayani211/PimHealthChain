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
  doctorId: string; // Optional, only for doctors

  @Prop()
  photo: string; // Optional, for all users

  @Prop()
  otp: string;

  @Prop()
  otpExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);