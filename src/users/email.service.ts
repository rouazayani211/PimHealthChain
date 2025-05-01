import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Log the SMTP credentials being loaded
    console.log('Initializing EmailService...');
    console.log('SMTP Host:', this.configService.get<string>('BREVO_SMTP_HOST'));
    console.log('SMTP Port:', this.configService.get<number>('BREVO_SMTP_PORT'));
    console.log('SMTP User:', this.configService.get<string>('BREVO_SMTP_USER'));
    console.log('SMTP Pass:', this.configService.get<string>('BREVO_SMTP_PASS') || 'undefined');
    console.log('Sender:', this.configService.get<string>('BREVO_SENDER'));

    // Create a Nodemailer transporter with Brevo SMTP settings
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('BREVO_SMTP_HOST'),
      port: this.configService.get<number>('BREVO_SMTP_PORT'),
      secure: false, // Use TLS
      auth: {
        user: this.configService.get<string>('BREVO_SMTP_USER'),
        pass: this.configService.get<string>('BREVO_SMTP_PASS'),
      },
    });

    // Test the SMTP connection on startup
    this.testSmtpConnection();
  }

  async testSmtpConnection() {
    console.log('Testing Brevo SMTP connection...');
    try {
      const result = await this.transporter.verify();
      console.log('Brevo SMTP connection successful:', result);
    } catch (error) {
      console.error('Brevo SMTP connection failed:', error.message);
      console.error('Full SMTP connection error:', JSON.stringify(error, null, 2));
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    console.log('Preparing to send OTP email...');
    console.log('Recipient:', to);
    console.log('OTP:', otp);

    const mailOptions = {
      from: this.configService.get<string>('BREVO_SENDER'),
      to,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
    };

    console.log('Mail Options:', JSON.stringify(mailOptions, null, 2));

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent via Brevo:', JSON.stringify(info, null, 2));
    } catch (error) {
      console.error('Error sending email via Brevo:', error.message);
      console.error('Full email sending error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}