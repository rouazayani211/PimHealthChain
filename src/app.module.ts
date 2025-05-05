import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './users/user.module';
import { JwtModule } from '@nestjs/jwt';
import { MessageModule } from './message/message.module';
import { NftModule } from './nft/nft.module';
import { NFTTimeAccessModule } from './blockchain/nft-time-access.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
    MessageModule,
    NftModule,
    NFTTimeAccessModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
  }
}