import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PinataService {
  private readonly pinataApiKey = 'ff81b0f447e12ef6376d';
  private readonly pinataSecretKey = 'e44b0f9ad2eef6dc4a3c22a9bf224ee0437bebeca86076292127e829ceeccf0b';

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('pinataMetadata', JSON.stringify({
        name: file.originalname
      }));

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }
} 