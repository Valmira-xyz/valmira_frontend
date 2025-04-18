import { config } from './config';
import axios from 'axios';

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  pairAddress: string;
  buyTax?: number;
  sellTax?: number;
  pairedToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const BACKEND_URL = config.apiUrl;

export const tokenService = {
  /**
   * Get token information from the backend
   * @param address Token contract address
   * @returns Promise with token information
   */
  async getTokenInfo(address: string): Promise<TokenInfo> {
    try {
      const response = await axios.get<ApiResponse<TokenInfo>>(
        `${BACKEND_URL}/web3/token/${address}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || 'Failed to fetch token information'
        );
      }

      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as any;
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      }
      throw new Error('Failed to validate token');
    }
  },
};
