import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import walletReducer from './slices/walletSlice';
import botReducer from './slices/botSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    wallets: walletReducer,
    bots: botReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 