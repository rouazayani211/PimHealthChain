import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NFTTimeAccessService } from './nft-time-access.service';

@Controller('nft-access')
@UseGuards(JwtAuthGuard)
export class NFTTimeAccessController {
  constructor(private readonly nftTimeAccessService: NFTTimeAccessService) {}

  @Post('grant')
  async grantAccess(
    @Body() body: {
      nftContract: string;
      tokenId: number;
      userAddress: string;
      durationInSeconds: number;
    }
  ) {
    return this.nftTimeAccessService.grantAccess(
      body.nftContract,
      body.tokenId,
      body.userAddress,
      body.durationInSeconds
    );
  }

  @Post('revoke')
  async revokeAccess(
    @Body() body: {
      nftContract: string;
      tokenId: number;
      userAddress: string;
    }
  ) {
    return this.nftTimeAccessService.revokeAccess(
      body.nftContract,
      body.tokenId,
      body.userAddress
    );
  }

  @Get('check')
  async hasAccess(
    @Body() body: {
      nftContract: string;
      tokenId: number;
      userAddress: string;
    }
  ) {
    return this.nftTimeAccessService.hasAccess(
      body.nftContract,
      body.tokenId,
      body.userAddress
    );
  }

  @Get('details')
  async getAccessGrant(
    @Body() body: {
      nftContract: string;
      tokenId: number;
      userAddress: string;
    }
  ) {
    return this.nftTimeAccessService.getAccessGrant(
      body.nftContract,
      body.tokenId,
      body.userAddress
    );
  }
} 