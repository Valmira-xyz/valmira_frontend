import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SplashAuthState {
  isTrialAuthenticated: boolean;
}

const initialState: SplashAuthState = {
  isTrialAuthenticated: false,
};

const splashAuthSlice = createSlice({
  name: 'splashAuth',
  initialState,
  reducers: {
    setTrialAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isTrialAuthenticated = action.payload;
    },
  },
});

export const { setTrialAuthenticated } = splashAuthSlice.actions;
export default splashAuthSlice.reducer;
