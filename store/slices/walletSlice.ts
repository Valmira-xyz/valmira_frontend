import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  Wallet, 
  WalletState, 
  WalletBalance, 
  ApiResponse,
  WalletsResponse,
  BalancesResponse 
} from '@/types';
import { walletApi } from '@/services/walletApi';
import { fetchProject } from './projectSlice';
import { getWalletBalances as getWeb3WalletBalances } from '@/services/web3Utils';
import { formatBalance } from '@/services/web3Utils';

const initialState: WalletState = {
  wallets: [],
  loading: false,
  error: null,
  selectedWallet: null
};

// Async thunks
export const generateWallets = createAsyncThunk(
  'wallets/generate',
  async ({ projectId, count, botId }: { projectId: string; count: number; botId: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await walletApi.generateWallets(projectId, count, botId) as ApiResponse<WalletsResponse>;
      setTimeout(() => {
        dispatch(fetchProject(projectId));
      }, 500);
      return response.data.wallets;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to generate wallets');
    }
  }
);

export const deleteMultipleWallets = createAsyncThunk(
  'wallets/deleteMultiple',
  async ({ projectId, walletIds }: { projectId: string; walletIds: string[] }, { rejectWithValue, dispatch }) => {
    try {
      await walletApi.deleteMultipleWallets(walletIds);
      setTimeout(() => {
        dispatch(fetchProject(projectId));
      }, 500);
      return walletIds;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete wallets');
    }
  }
);

export const getWalletBalances = createAsyncThunk(
  'wallets/getBalances',
  async ({ tokenAddress, walletAddresses }: { tokenAddress: string; walletAddresses: string[] }, { rejectWithValue }) => {
    try {
      const balances = await getWeb3WalletBalances(walletAddresses, tokenAddress);
      
      // Convert string balances to numbers and map to expected format
      return balances;
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
      .addCase(deleteMultipleWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleWallets.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        state.wallets = state.wallets.filter(wallet => !action.payload.includes(wallet._id));
      })
      .addCase(deleteMultipleWallets.rejected, (state, action) => {
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