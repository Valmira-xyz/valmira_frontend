import { getAuthHeaders } from './botService';
import { config } from './config';
import axios from 'axios';

const BACKEND_URL = config.apiUrl;

// Configure axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Wallet API endpoints
export const walletApi = {
  generateWallets: async (
    projectId: string,
    countsOfWallets: number,
    botId: string,
    role: string,
    botType: string
  ) => {
    try {
      const response = await api.post(
        '/wallets/multiple',
        {
          projectId,
          countsOfWallets,
          botId,
          role,
          botType,
        },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error generating wallets:', error);
      throw error;
    }
  },
  deleteMultipleWallets: async (botId: string, walletAddresses: string[]) => {
    try {
      const config = getAuthHeaders();
      const response = await api.post(
        '/wallets/delete-multiple',
        { botId, walletAddresses },
        config
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting multiple wallets:', error);
      throw error;
    }
  },
  downloadWalletAsCsv: async (publicKey: string): Promise<Blob> => {
    try {
      const config = {
        ...getAuthHeaders(),
        responseType: 'blob' as const, // Important for file downloads
      };
      const response = await api.get(`/wallets/download/${publicKey}`, config);
      return response.data as Blob;
    } catch (error) {
      console.error('Error downloading wallet as CSV:', error);
      throw error;
    }
  },
  downloadAllWalletsAsCsv: async (botId: string): Promise<Blob> => {
    try {
      const config = {
        ...getAuthHeaders(),
        responseType: 'blob' as const, // Important for file downloads
      };
      const response = await api.get(`/wallets/download-all/${botId}`, config);
      return response.data as Blob;
    } catch (error) {
      console.error('Error downloading all wallets as CSV:', error);
      throw error;
    }
  },
};

export default api;
