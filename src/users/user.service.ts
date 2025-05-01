import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    console.log('UserService initialized');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log('Creating user:', createUserDto.email);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await createdUser.save();
    console.log('User created:', savedUser.email);
    return savedUser;
  }

  async login(loginUserDto: LoginUserDto): Promise<{ token: string }> {
    console.log('Login attempt for email:', loginUserDto.email);
    const user = await this.userModel.findOne({ email: loginUserDto.email }).exec();
    if (!user) {
      console.error('User not found for email:', loginUserDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('Stored password hash:', user.password);
    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isPasswordValid) {
      console.error('Password comparison failed for email:', loginUserDto.email);
      console.log('Provided password:', loginUserDto.password); // Remove in production
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload);
    console.log('Login successful, token generated for email:', loginUserDto.email);
    return { token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string, otp: string, userId: string }> {
    console.log('Forgot password request for email:', forgotPasswordDto.email);
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email }).exec();
    if (!user) {
      console.error('User not found for email:', forgotPasswordDto.email);
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    console.log('Generated OTP:', otp, 'Expires at:', otpExpires);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    console.log('OTP saved for email:', forgotPasswordDto.email);

    console.log('Sending OTP email to:', forgotPasswordDto.email);
    try {
      await this.emailService.sendOtpEmail(user.email, otp);
      console.log('OTP email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send OTP email to:', user.email);
      console.error('Email sending error:', error.message);
      throw error;
    }

    return { message: 'OTP sent to your email', otp, userId: user._id.toString() };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string ,otp:String}> {
    console.log('Verifying OTP for email:', verifyOtpDto.email);
    const user = await this.userModel.findOne({ email: verifyOtpDto.email }).exec();
    if (!user) {
      console.error('User not found for email:', verifyOtpDto.email);
      throw new NotFoundException('User not found');
    }

    if (user.otp !== verifyOtpDto.otp || user.otpExpires < new Date()) {
      console.error('Invalid or expired OTP for email:', verifyOtpDto.email);
      throw new BadRequestException('Invalid or expired OTP');
    }

    console.log('OTP verified successfully for email:', verifyOtpDto.email);
    return { message: 'OTP verified successfully' ,otp:verifyOtpDto.otp};
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    console.log('Resetting password for email:', resetPasswordDto.email);
    const user = await this.userModel.findOne({ email: resetPasswordDto.email }).exec();
    if (!user) {
      console.error('User not found for email:', resetPasswordDto.email);
      throw new NotFoundException('User not found');
    }

    if (user.otp !== resetPasswordDto.otp || user.otpExpires < new Date()) {
      console.error('Invalid or expired OTP for email:', resetPasswordDto.email);
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    console.log('New password hash:', hashedPassword);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;

    try {
      await user.save();
      console.log('Password reset successfully for email:', resetPasswordDto.email);
    } catch (error) {
      console.error('Failed to save new password for email:', resetPasswordDto.email, error.message);
      throw new InternalServerErrorException('Failed to reset password');
    }

    return { message: 'Password reset successfully' };
  }
}