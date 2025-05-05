import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NFTTimeAccessService {
  private contract;
  private provider;
  private wallet;

  constructor() {
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    // Using the same wallet as the NFT minting service
    this.wallet = new ethers.Wallet('0x3f31c3788e2c346f998c29892ee8efe8956ad4b2e71ef7c5e1da93fd9a0aa067', this.provider);

    // Load contract ABI and address
    const contractPath = path.join(process.cwd(), 'artifacts/contracts/NFTTimeAccess.sol/NFTTimeAccess.json');
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const contractAddress = '0x23A70b0B37DaB0950740b5bDD07c0DAc23260fD9';

    // Initialize contract
    this.contract = new ethers.Contract(
      contractAddress,
      contractJson.abi,
      this.wallet
    );
  }

  async grantAccess(
    nftContract: string,
    tokenId: number,
    userAddress: string,
    durationInSeconds: number
  ): Promise<boolean> {
    try {
      console.log('Granting access with wallet:', this.wallet.address);
      console.log('NFT Contract:', nftContract);
      console.log('Token ID:', tokenId);
      console.log('User Address:', userAddress);
      console.log('Duration:', durationInSeconds);

      const tx = await this.contract.grantAccess(
        nftContract,
        tokenId,
        userAddress,
        durationInSeconds
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }

  async revokeAccess(
    nftContract: string,
    tokenId: number,
    userAddress: string
  ): Promise<boolean> {
    try {
      const tx = await this.contract.revokeAccess(
        nftContract,
        tokenId,
        userAddress
      );
      await tx.wait();
      return true;
    } catch (error) {
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  async hasAccess(
    nftContract: string,
    tokenId: number,
    userAddress: string
  ): Promise<boolean> {
    try {
      return await this.contract.hasAccess(
        nftContract,
        tokenId,
        userAddress
      );
    } catch (error) {
      throw new Error(`Failed to check access: ${error.message}`);
    }
  }

  async getAccessGrant(
    nftContract: string,
    tokenId: number,
    userAddress: string
  ): Promise<{ startTime: number; endTime: number; isActive: boolean }> {
    try {
      const [startTime, endTime, isActive] = await this.contract.getAccessGrant(
        nftContract,
        tokenId,
        userAddress
      );
      return {
        startTime: startTime.toNumber(),
        endTime: endTime.toNumber(),
        isActive
      };
    } catch (error) {
      throw new Error(`Failed to get access grant: ${error.message}`);
    }
  }
} 