import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Wallet API endpoints
export const walletApi = {
  generateWallets: async (projectId: string, countsOfWallets: number) => {
    const response = await api.post('/wallets/multiple', {
      projectId,
      countsOfWallets,
    });
    return response.data;
  },
  
  getWalletBalances: async (walletAddresses: string[]) => {
    const response = await api.post('/wallets/balances', {
      walletAddresses,
    });
    return response.data;
  }
};

export default api; 