import { Module } from '@nestjs/common';
import { NFTTimeAccessController } from './nft-time-access.controller';
import { NFTTimeAccessService } from './nft-time-access.service';

@Module({
  controllers: [NFTTimeAccessController],
  providers: [NFTTimeAccessService],
  exports: [NFTTimeAccessService]
})
export class NFTTimeAccessModule {} 