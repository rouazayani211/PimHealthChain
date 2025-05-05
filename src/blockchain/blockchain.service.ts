import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BlockchainService {
  private contract;
  private provider;
  private wallet;

  constructor() {
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    this.wallet = new ethers.Wallet('0x3f31c3788e2c346f998c29892ee8efe8956ad4b2e71ef7c5e1da93fd9a0aa067', this.provider);

    // Load contract ABI and address
    const contractPath = path.join(process.cwd(), 'artifacts/contracts/FileNFT.sol/FileNFT.json');
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const contractAddress = '0xCD8D6882B0D367F100c252c0B587C23409010Bd7';

    // Initialize contract
    this.contract = new ethers.Contract(
      contractAddress,
      contractJson.abi,
      this.wallet
    );
  }

  async mintNFT(recipientAddress: string, tokenURI: string): Promise<number> {
    try {
      const tx = await this.contract.mintNFT(recipientAddress, tokenURI);
      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt.logs[0];
      const tokenId = event.args[2].toNumber();
      
      return tokenId;
    } catch (error) {
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  async getTokenURI(tokenId: number): Promise<string> {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      throw new Error(`Failed to get token URI: ${error.message}`);
    }
  }
} 