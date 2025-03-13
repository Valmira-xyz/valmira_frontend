import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  Wallet, 
  WalletState, 
  WalletBalance, 
  ApiResponse,
  WalletsResponse,
  BalancesResponse 
} from '@/types';
import { walletApi } from '@/services/api';

const initialState: WalletState = {
  wallets: [],
  loading: false,
  error: null,
  selectedWallet: null
};

// Async thunks
export const generateWallets = createAsyncThunk(
  'wallets/generate',
  async ({ projectId, count }: { projectId: string; count: number }, { rejectWithValue }) => {
    try {
      const response = await walletApi.generateWallets(projectId, count) as ApiResponse<WalletsResponse>;
      return response.data.wallets;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to generate wallets');
    }
  }
);

export const getWalletBalances = createAsyncThunk(
  'wallets/getBalances',
  async (walletAddresses: string[], { rejectWithValue }) => {
    try {
      const response = await walletApi.getWalletBalances(walletAddresses) as ApiResponse<BalancesResponse>;
      return response.data.balances;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to get wallet balances');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWalletBnbToSpend: (state, action: PayloadAction<{ walletId: string; amount: number }>) => {
      const { walletId, amount } = action.payload;
      const wallet = state.wallets.find(w => w._id === walletId);
      if (wallet) {
        wallet.bnbToSpend = amount;
      }
    },
    setAllWalletsBnbToSpend: (state, action: PayloadAction<number>) => {
      const amountPerWallet = action.payload;
      state.wallets.forEach(wallet => {
        wallet.bnbToSpend = amountPerWallet;
      });
    },
    clearWallets: (state) => {
      state.wallets = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateWallets.fulfilled, (state, action: PayloadAction<Wallet[]>) => {
        state.loading = false;
        state.wallets = action.payload.map(wallet => ({
          ...wallet,
          bnbBalance: 0,
          tokenAmount: Math.random() * 1000000, // Placeholder until real data is fetched
          bnbToSpend: 0,
        }));
      })
      .addCase(generateWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getWalletBalances.fulfilled, (state, action) => {
        const balances = action.payload;
        state.wallets = state.wallets.map(wallet => {
          const balance = balances.find((b: WalletBalance) => b.address === wallet.publicKey);
          if (balance) {
            return {
              ...wallet,
              bnbBalance: balance.bnbBalance,
              tokenAmount: balance.tokenAmount,
            };
          }
          return wallet;
        });
      });
  },
});

export const { setWalletBnbToSpend, setAllWalletsBnbToSpend, clearWallets } = walletSlice.actions;
export default walletSlice.reducer; 