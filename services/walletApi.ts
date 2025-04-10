import axios from 'axios';
import { getAuthHeaders } from './botService';

const BACKEND_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:5000';

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
  generateWallets: async (projectId: string, countsOfWallets: number, botId: string) => {
    const response = await api.post('/wallets/multiple', {
      projectId,
      countsOfWallets,
      botId
    },
    getAuthHeaders()
  );
    return response.data;
  },
  deleteMultipleWallets: async (botId: string, walletAddresses: string[]) => {
    const config = getAuthHeaders();
    const response = await api.post('/wallets/delete-multiple', { botId, walletAddresses },
    config  
  );
    return response.data;
  },
  downloadWalletAsCsv: async (publicKey: string): Promise<Blob> => {
    const config = {
      ...getAuthHeaders(),
      responseType: 'blob' as 'blob', // Important for file downloads
    };
    const response = await api.get(`/wallets/download/${publicKey}`, config);
    return response.data as Blob;
  },
  downloadAllWalletsAsCsv: async (projectId: string, botId: string): Promise<Blob> => {
    const config = {
      ...getAuthHeaders(),
      responseType: 'blob' as 'blob', // Important for file downloads
    };
    const response = await api.get(`/wallets/download-all/${projectId}/${botId}`, config);
    return response.data as Blob;
  }
};

export default api; 