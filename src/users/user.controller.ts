import { Controller, Post, Body, HttpException, HttpStatus, UseInterceptors, UploadedFile, Get, Param, Res, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png/;
      const ext = extname(file.originalname).toLowerCase();
      const mimetype = allowedTypes.test(file.mimetype);
      const extnameValid = allowedTypes.test(ext);
      if (mimetype && extnameValid) {
        return cb(null, true);
      }
      cb(new HttpException('Only JPEG/PNG images are allowed', HttpStatus.BAD_REQUEST), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  async signup(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    try {
      const user = await this.userService.create(createUserDto, file);
      return { message: 'User created successfully', user };
    } catch (error) {
      throw new HttpException(error.message || 'User creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      return await this.userService.login(loginUserDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
 

  @Post('forgot-password')
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  try {
    return await this.userService.forgotPassword(forgotPasswordDto); 
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      return await this.userService.verifyOtp(verifyOtpDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.userService.resetPassword(resetPasswordDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('doctors')
  async getAllDoctors() {
    try {
      const doctors = await this.userService.findAllDoctors();
      return { success: true, data: doctors };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.findUserById(id);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('photo/:id')
  async getUserPhoto(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      const user = await this.userService.findUserById(id);
      if (!user.photo) {
        return res.status(404).json({ success: false, message: 'No photo available' });
      }
      
      // Return the full URL for the photo
      const photoUrl = `${req.protocol}://${req.get('host')}/${user.photo}`;
      return res.json({ success: true, photoUrl });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  @Get('image/:id')
  async getUserImage(@Param('id') id: string, @Res() res) {
    try {
      const user = await this.userService.findUserById(id);
      if (!user.photo) {
        return res.status(404).json({ success: false, message: 'No image available for this user' });
      }
      
      // Return the image file directly
      return res.sendFile(user.photo, { root: './' });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  @Get('doctor/image/:id')
  async getDoctorImage(@Param('id') id: string, @Res() res) {
    try {
      const doctor = await this.userService.findDoctorById(id);
      if (!doctor.photo) {
        return res.status(404).json({ success: false, message: 'No image available for this doctor' });
      }
      
      // Return the image file directly
      return res.sendFile(doctor.photo, { root: './' });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}