import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BotService, BotResponse } from '@/services/botService';
import { fetchProject, fetchProjects } from './projectSlice';

// Define types
export type BotType = 'SnipeBot' | 'VolumeBot' | 'HolderBot' | 'AutoSellBot';
export type LiquidationSnipeBotStatus = 'ready_to_simulation' 
  | "simulating" | "simulation_failed" | "simulation_succeeded" 
  | "sniping" |  'snipe_succeeded' | 'snipe_failed' 
export type AutoSellBotStatus = 'ready_to_autosell' 
  | 'auto_selling' | "selling" | "sell_failed" | "sell_succeeded";
export type VolumeBotStatus = "Active" | "Inactive";
export type HolderBotStatus = "Active" | "Inactive";
export type Speed = 'slow' | 'medium' | 'fast';

// Combined BotStatus type
export type BotStatus = LiquidationSnipeBotStatus | VolumeBotStatus | HolderBotStatus | AutoSellBotStatus | 'insufficient_funds' | 'Error';

export interface AutoSellConfig {
  enabled: boolean;
  targetPrice: number;
  stopLoss: number;
}

export interface BotWallet {
  address: string;
  bnbBalance: number;
  tokenBalance: number;
  sellPrice: number;
  enabled: boolean;
}

export interface BotConfig {
  _id?: string;
  status?: BotStatus;
  enabled: boolean;
  amount?: number;
  nativeCurrency?: number;
  tokenAmount?: number;
  autoSell?: AutoSellConfig;
  speed?: Speed;
  maxBundleSize?: number;
  wallets?: BotWallet[];
  depositWalletId?: string;
  bnbBalance?: number;
  tokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
  lastError?: {
    type: string;
    message: string;
    details: string;
  };
}

export interface BotsState {
  bots: Record<string, Record<string, BotConfig>>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: BotsState = {
  bots: {},
  loading: false,
  error: null,
};

// Async thunks
export const toggleBot = createAsyncThunk(
  'bots/toggleBot',
  async ({ projectId, botId, enabled }: { projectId: string; botId: string; enabled: boolean }, { rejectWithValue, dispatch }) => {
    try {
      const data = await BotService.toggleOrCreateBot(botId, enabled);
      
      // Dispatch fetchProject action to update project data immediately after successful toggle
      setTimeout(() => {
        dispatch(fetchProject(projectId));
        dispatch(fetchProjects());
      }, 500);
      
      return {
        projectId,
        botId,
        data,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle bot');
    }
  }
);

export const fetchProjectBots = createAsyncThunk(
  'bots/fetchProjectBots',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const data = await BotService.getProjectBots(projectId);
      return {
        projectId,
        data,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project bots');
    }
  }
);

// Create the slice
const botSlice = createSlice({
  name: 'bots',
  initialState,
  reducers: {
    updateBotConfig: (state, action: PayloadAction<{ projectId: string; botType: BotType; config: Partial<BotConfig> }>) => {
      const { projectId, botType, config } = action.payload;
      
      // Ensure the project exists in state
      if (!state.bots[projectId]) {
        state.bots[projectId] = {};
      }
      
      // Ensure the bot type exists for this project
      if (!state.bots[projectId][botType]) {
        state.bots[projectId][botType] = {
          enabled: false,
          status: 'Inactive',
          lastError: undefined
        };
      }
      
      // Update the config
      state.bots[projectId][botType] = {
        ...state.bots[projectId][botType],
        ...config,
      };
    },
    updateVolumeGeneration: (state, action: PayloadAction<{ projectId: string; botId: string; generatedVolume: number }>) => {
      const { projectId, botId, generatedVolume } = action.payload;
      
      // Find the bot by ID in the project's bots
      if (state.bots[projectId]) {
        Object.entries(state.bots[projectId]).forEach(([botType, bot]) => {
          if (bot._id === botId) {
            state.bots[projectId][botType as BotType] = {
              ...bot,
              generatedVolume: (bot.generatedVolume || 0) + generatedVolume,
            };
          }
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Toggle Bot
      .addCase(toggleBot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBot.fulfilled, (state, action) => {
        const { projectId, botId, data } = action.payload;
        
        // Ensure the project exists in state
        if (!state.bots[projectId]) {
          state.bots[projectId] = {};
        }
        
        // Update the bot config with the response data
        state.bots[projectId][botId] = {
          ...state.bots[projectId][botId],
          _id: data._id,
          enabled: data.isEnabled,
          status: data.status as BotStatus || 'Inactive',
          depositWalletId: data.depositWalletId?._id,
          bnbBalance: data.bnbBalance || 0,
          tokenBalance: data.tokenBalance || 0,
          generatedVolume: data.generatedVolume || 0,
          generatedHolders: data.generatedHolders || 0,
        };
        
        state.loading = false;
      })
      .addCase(toggleBot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Project Bots
      .addCase(fetchProjectBots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectBots.fulfilled, (state, action) => {
        const { projectId, data } = action.payload;
        
        // Initialize the project in state if it doesn't exist
        if (!state.bots[projectId]) {
          state.bots[projectId] = {};
        }
        
        // Process each bot from the response
        data.forEach((bot: BotResponse) => {
          state.bots[projectId][bot.botType] = {
            _id: bot._id,
            enabled: bot.isEnabled,
            status: bot.status as BotStatus || 'Inactive',
            depositWalletId: bot.depositWalletId?._id,
            bnbBalance: bot.bnbBalance || 0,
            tokenBalance: bot.tokenBalance || 0,
            generatedVolume: bot.generatedVolume || 0,
            generatedHolders: bot.generatedHolders || 0,
          };
        });
        
        state.loading = false;
      })
      .addCase(fetchProjectBots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateBotConfig, updateVolumeGeneration } = botSlice.actions;
export default botSlice.reducer; 