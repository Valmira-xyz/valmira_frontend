import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import walletReducer from './slices/walletSlice';
import botReducer from './slices/botSlice';
import { useDispatch } from 'react-redux';
import { projectApi } from './api/project';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    wallets: walletReducer,
    bots: botReducer,

    [projectApi.reducerPath]: projectApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'projects/fetchAll/fulfilled',
          'projects/fetchPublic/fulfilled',
          'projects/fetchStats/pending',
          'projects/fetchStats/fulfilled',
          'projects/fetchBotPerformance/pending',
          'projects/fetchBotPerformance/fulfilled',
          'projects/fetchProfitTrending/pending',
          'projects/fetchProfitTrending/fulfilled',
          'projects/fetchVolumeTrending/pending',
          'projects/fetchVolumeTrending/fulfilled'
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.timestamp',
          'meta.arg.timestamp',
          'meta.arg.timeRange',
          'meta.arg.startDate',
          'meta.arg.endDate',
          'payload.metrics.lastUpdate',
          'payload.timeRange'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'projects.projects.updatedAt',
          'projects.projects.createdAt',
          'projects.projectStats.metrics.lastUpdate',
          'projects.projectStats.timeRange',
          'projects.currentProject.updatedAt',
          'projects.currentProject.createdAt'
        ],
      },
    }).concat(projectApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 

export const useAppDispatch = () => useDispatch<AppDispatch>();
