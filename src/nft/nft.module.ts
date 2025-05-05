import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { PinataModule } from '../pinata/pinata.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
 
@Module({
  imports: [PinataModule, BlockchainModule],
  controllers: [NftController],
})
export class NftModule {} 