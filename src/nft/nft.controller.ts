import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PinataService } from '../pinata/pinata.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('nft')
export class NftController {
  constructor(
    private readonly pinataService: PinataService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Post('mint')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async mintNFT(
    @UploadedFile() file: Express.Multer.File,
    @Body('recipientAddress') recipientAddress: string,
  ) {
    try {
      // Upload file to IPFS
      const ipfsUrl = await this.pinataService.uploadFile(file);

      // Mint NFT with the IPFS URL
      const tokenId = await this.blockchainService.mintNFT(recipientAddress, ipfsUrl);

      return {
        success: true,
        tokenId,
        ipfsUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
} 