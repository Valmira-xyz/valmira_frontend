import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
  walletAddress: string | null
  isAuthenticated: boolean
  projects: any[] // Replace with proper type when available
  loading: "idle" | "pending" | "succeeded" | "failed"
  error: string | null
}

const initialState: UserState = {
  walletAddress: null,
  isAuthenticated: false,
  projects: [],
  loading: "idle",
  error: null,
}

export const connectWallet = createAsyncThunk("user/connectWallet", async (address: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return address
})

export const fetchUserData = createAsyncThunk("user/fetchUserData", async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { projects: [{ id: "1", name: "Sample Project" }] }
})

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.walletAddress = null
      state.isAuthenticated = false
      state.projects = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWallet.fulfilled, (state, action: PayloadAction<string>) => {
        state.walletAddress = action.payload
        state.isAuthenticated = true
        state.loading = "succeeded"
      })
      .addCase(fetchUserData.fulfilled, (state, action: PayloadAction<{ projects: any[] }>) => {
        state.projects = action.payload.projects
        state.loading = "succeeded"
      })
  },
})

export const { logout } = userSlice.actions

export default userSlice.reducer

