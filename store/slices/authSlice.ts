import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { authService } from '@/services/authService';
import type { AuthState, User } from '@/types';

const initialState: AuthState = {
  user: null,
  walletAddress: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  projects: [],
};

// Async thunks
export const connectWallet = createAsyncThunk(
  'auth/connectWallet',
  async (address: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return address;
  }
);

export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async () => {
    const userData = await authService.getProfile();
    return {
      user: userData,
      isAdmin: userData.role === 'admin',
      projects: userData.projects || [],
    };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.role === 'admin';
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.walletAddress = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
      state.projects = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        connectWallet.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.walletAddress = action.payload;
          state.isAuthenticated = true;
          state.isLoading = false;
        }
      )
      .addCase(connectWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to connect wallet';
      })
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUserData.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: User;
            isAdmin: boolean;
            projects: any[];
          }>
        ) => {
          state.user = action.payload.user;
          state.isAdmin = action.payload.isAdmin;
          state.projects = action.payload.projects;
          state.isLoading = false;
        }
      )
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user data';
      });
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
