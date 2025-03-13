import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { User, AuthState } from '@/types'

const initialState: AuthState = {
  user: null,
  walletAddress: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  projects: [],
}

// Async thunks
export const connectWallet = createAsyncThunk(
  'auth/connectWallet',
  async (address: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    return address
  }
)

export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { projects: [{ id: '1', name: 'Sample Project' }] }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.walletAddress = null
      state.isAuthenticated = false
      state.error = null
      state.projects = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWallet.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(connectWallet.fulfilled, (state, action: PayloadAction<string>) => {
        state.walletAddress = action.payload
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to connect wallet'
      })
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserData.fulfilled, (state, action: PayloadAction<{ projects: any[] }>) => {
        state.projects = action.payload.projects
        state.isLoading = false
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch user data'
      })
  },
})

export const { setUser, setLoading, setError, logout } = authSlice.actions
export default authSlice.reducer 