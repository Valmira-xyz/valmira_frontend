import { fetchProject } from './projectSlice';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { walletApi } from '@/services/walletApi';
import type {
  ApiResponse,
  Wallet,
  WalletsResponse,
  WalletState,
} from '@/types';

const initialState: WalletState = {
  wallets: [],
  loading: false,
  error: null,
  selectedWallet: null,
};

// Async thunks
export const generateWallets = createAsyncThunk(
  'wallets/generate',
  async (
    {
      projectId,
      count,
      botId,
      role,
      botType,
    }: {
      projectId: string;
      count: number;
      botId: string;
      role: string;
      botType: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = (await walletApi.generateWallets(
        projectId,
        count,
        botId,
        role,
        botType
      )) as ApiResponse<WalletsResponse>;
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
  async (
    { projectId, walletIds }: { projectId: string; walletIds: string[] },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await walletApi.deleteMultipleWallets(projectId, walletIds);
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

const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWalletNativeToSpend: (
      state,
      action: PayloadAction<{ walletId: string; amount: number }>
    ) => {
      const { walletId, amount } = action.payload;
      const wallet = state.wallets.find((w) => w._id === walletId);
      if (wallet) {
        wallet.nativeToSpend = amount;
      }
    },
    setAllWalletsNativeToSpend: (state, action: PayloadAction<number>) => {
      const amountPerWallet = action.payload;
      state.wallets.forEach((wallet) => {
        wallet.nativeToSpend = amountPerWallet;
      });
    },
    clearWallets: (state) => {
      state.wallets = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        generateWallets.fulfilled,
        (state, action: PayloadAction<Wallet[]>) => {
          state.loading = false;
          state.wallets = action.payload.map((wallet) => ({
            ...wallet,
            nativeBalance: 0,
            tokenAmount: Math.random() * 1000000, // Placeholder until real data is fetched
            nativeToSpend: 0,
          }));
        }
      )
      .addCase(generateWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMultipleWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteMultipleWallets.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.loading = false;
          state.wallets = state.wallets.filter(
            (wallet) => !action.payload.includes(wallet._id)
          );
        }
      )
      .addCase(deleteMultipleWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setWalletNativeToSpend,
  setAllWalletsNativeToSpend,
  clearWallets,
} = walletSlice.actions;
export default walletSlice.reducer;
