import axios from 'axios';
import { getAuthHeaders } from './projectService';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
  deleteMultipleWallets: async (walletIds: string[]) => {
    const config = getAuthHeaders();
    const response = await api.post('/wallets/delete-multiple', { walletIds },
    config  
  );
    return response.data;
  }
};

export default api; 