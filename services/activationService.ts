import { config } from './config';
import axios from 'axios';

const BACKEND_URL = config.apiUrl;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export interface ActivationFeeData {
  setupFeeUSD: number;
  feeWalletAddress: string;
  chainName: string;
}

export interface NativeCurrencyPrice {
  currency: string;
  price: number;
  timestamp: string;
}

export interface ActivationVerificationResult {
  success: boolean;
  message: string;
  data?: {
    project: any;
  };
}

export const activationService = {
  // Get activation fee information for a project
  getActivationFee: async (projectId: string): Promise<ActivationFeeData> => {
    try {
      const response = await axios.get<{ data: ActivationFeeData }>(
        `${BACKEND_URL}/fees/projects/${projectId}/activation-fee`,
        getAuthHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activation fee:', error);
      throw error;
    }
  },

  // Verify activation payment for a project
  verifyActivation: async (
    projectId: string
  ): Promise<ActivationVerificationResult> => {
    try {
      const response = await axios.post<ActivationVerificationResult>(
        `${BACKEND_URL}/fees/projects/${projectId}/verify-activation`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error verifying activation:', error);
      // Return the error response data if available
      if (error.response?.data) {
        return error.response.data as ActivationVerificationResult;
      }
      throw error;
    }
  },

  // Get current native currency price
  getNativeCurrencyPrice: async (
    currency: 'BNB' | 'ETH'
  ): Promise<NativeCurrencyPrice> => {
    try {
      const response = await axios.get<{ data: NativeCurrencyPrice }>(
        `${BACKEND_URL}/fees/native-price/${currency}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching native currency price:', error);
      throw error;
    }
  },

  // Calculate native amount from USD
  calculateNativeAmount: (usdAmount: number, nativePrice: number): number => {
    return usdAmount / nativePrice;
  },

  // Get blockchain explorer URL for a given address and chain
  getExplorerUrl: (address: string, chainName: string): string => {
    const baseUrl =
      chainName === 'BSC_MAINNET'
        ? 'https://bscscan.com/address/'
        : 'https://etherscan.io/address/';
    return `${baseUrl}${address}`;
  },

  // Get native currency symbol from chain name
  getNativeCurrencySymbol: (chainName: string): string => {
    return chainName === 'BSC_MAINNET' ? 'BNB' : 'ETH';
  },

  // Get network name for display
  getNetworkName: (chainName: string): string => {
    return chainName === 'BSC_MAINNET' ? 'BSC' : 'Ethereum';
  },
};
