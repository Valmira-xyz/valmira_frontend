import axios from 'axios';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { config } from '@/services/config';
import type {
  ActivityLog,
  BotPerformanceHistory,
} from '@/services/projectService';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types';

interface PackData {
  packType: string;
  packConfig: {
    snipeBotConfig?: {
      walletCount: number;
      tokenAmount: number;
    };
    distributionBotConfig?: {
      targetWalletCount: number;
    };
    volumeBotConfig?: {
      minNativeAmount: number;
      maxNativeAmount: number;
      timeSpanBetweenTransactions: number;
      targetVolume: number;
    };
    holderBotConfig?: {
      targetHolders: number;
    };
    autoSellBotConfig?: {
      targetPrice: number;
      stopLoss: number;
    };
  };
  containingBots: string[];
  // Include project data for pack creation
  name: string;
  tokenAddress: string;
  chainId: number;
  symbol: string;
  totalSupply: string;
  isImported: boolean;
  pairAddress: string;
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    websiteLink?: string;
    telegramLink?: string;
    twitterLink?: string;
    discordLink?: string;
    buyFee: number;
    sellFee: number;
    maxHoldingLimit_: number;
    maxBuyLimit_: number;
    maxSellLimit_: number;
    templateNumber: number;
  };
  chainName: string;
}

interface Pack {
  _id: string;
  packType: string;
  packConfig: PackData['packConfig'];
  containingBots: string[];
  projectId: string;
  userId: string;
  status: 'pending' | 'deploying' | 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
  estimatedCost?: string;
  deploymentProgress?: number;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  // Pack-related state
  packs: Pack[];
  currentPack: Pack | null;
  globalPackParameters: any | null;
  deploymentProgress: number;
  deploymentStatus: string;
  // Common state
  loading: boolean;
  error: string | null;
  volumeData: any;
  projectStats: any;
  nativeCurrencyLoading: boolean;
  globalMetrics: any;
  nativeCurrencyPrice: {
    BSC_MAINNET: number;
    ETH_MAINNET: number;
  };
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  // Pack-related initial state
  packs: [],
  currentPack: null,
  globalPackParameters: null,
  deploymentProgress: 0,
  deploymentStatus: 'idle',
  // Common initial state
  loading: false,
  error: null,
  volumeData: null,
  projectStats: null,
  nativeCurrencyLoading: false,
  globalMetrics: null,
  nativeCurrencyPrice: {
    BSC_MAINNET: 300,
    ETH_MAINNET: 2000,
  },
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getProjects();
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchPublicProjects = createAsyncThunk(
  'projects/fetchPublic',
  async (
    {
      pageIndex = 0,
      maxPageCount = 10,
      isProject = true,
    }: { pageIndex?: number; maxPageCount?: number; isProject?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      return await projectService.getPublicProjects(
        pageIndex,
        maxPageCount,
        isProject
      );
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId);
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData: Partial<Project>, { rejectWithValue }) => {
    try {
      return await projectService.createProject(projectData);
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const updateProjectStatus = createAsyncThunk(
  'projects/updateStatus',
  async (
    { projectId, status }: { projectId: string; status: 'active' | 'inactive' },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.updateProjectStatus(projectId, status);
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchVolumeData = createAsyncThunk(
  'projects/fetchVolumeData',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getVolumeData(projectId);
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchProjectStats = createAsyncThunk(
  'projects/fetchStats',
  async (
    {
      projectId,
      timeRange,
    }: { projectId: string; timeRange?: { start: Date; end: Date } },
    { rejectWithValue }
  ) => {
    try {
      // Convert Date objects to ISO strings for serialization

      const stats = await projectService.getProjectStats(projectId, timeRange);

      // Return the stats as is - the dates will be handled in the reducer
      return stats;
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'projects/fetchRecentActivity',
  async (
    {
      projectId,
      timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    }: {
      projectId: string;
      timeRange?: {
        start: Date;
        end: Date;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.getRecentActivity(projectId, timeRange);
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchBotPerformance = createAsyncThunk(
  'projects/fetchBotPerformance',
  async (
    {
      projectId,
      startDate,
      endDate,
    }: { projectId: string; startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.getBotPerformanceHistory(
        projectId,
        startDate,
        endDate
      );
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchNativeCurrencyPrice = createAsyncThunk(
  'projects/fetchNativeCurrencyPrice',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch BSC price
      const bscResponse = await axios.get<{
        success: boolean;
        data: {
          price: number;
          symbol: string;
          currency: string;
        };
      }>(`${config.apiUrl}/web3/native-price/BSC_MAINNET`);

      // Fetch ETH price
      const ethResponse = await axios.get<{
        success: boolean;
        data: {
          price: number;
          symbol: string;
          currency: string;
        };
      }>(`${config.apiUrl}/web3/native-price/ETH_MAINNET`);

      const prices = {
        BSC_MAINNET: bscResponse.data.success
          ? bscResponse.data.data.price
          : 600,
        ETH_MAINNET: ethResponse.data.success
          ? ethResponse.data.data.price
          : 2500,
      };

      return prices;
    } catch (error: any) {
      console.error('Failed to fetch native currency prices:', error);
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchGlobalMetrics = createAsyncThunk(
  'projects/fetchGlobalMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const result = await projectService.getGlobalMetrics();
      return result;
    } catch (error: any) {
      console.error('Failed to fetch global metrics:', error);
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

// Pack-related async thunks using project service with isProject=false
export const createPack = createAsyncThunk(
  'projects/createPack',
  async (packData: PackData, { rejectWithValue }) => {
    try {
      console.log('Creating pack with data:', packData);

      const response = await fetch(
        `${config.apiUrl}/projects?isProject=false`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            ...packData,
            packType: packData.packType,
            packConfig: packData.packConfig,
            containingBots: packData.containingBots,
          }),
        }
      );

      console.log('Pack creation response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          return rejectWithValue([
            'NETWORK_ERROR',
            `HTTP ${response.status}: ${response.statusText}`,
          ]);
        }
        console.error('Pack creation failed:', errorData);
        return rejectWithValue([
          errorData.errorType || 'CREATION_ERROR',
          errorData.message || 'Failed to create pack',
        ]);
      }

      const result = await response.json();
      console.log('Pack creation successful:', result);
      return result.data.project; // Backend returns as project but it's actually a pack
    } catch (error: any) {
      console.error('Pack creation error:', error);

      // Handle network errors and other fetch errors properly
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return rejectWithValue([
          'NETWORK_ERROR',
          'Network error occurred. Please check your connection.',
        ]);
      }

      return rejectWithValue([
        'CREATION_ERROR',
        error.message?.toString().slice(0, 200) || 'Failed to create pack',
      ]);
    }
  }
);

export const fetchPacks = createAsyncThunk(
  'projects/fetchPacks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/projects?isProject=false`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch packs');
      }

      const result = await response.json();
      console.log('[123123123]', result.data.projects);
      return result.data.projects; // Backend returns as projects but they're actually packs
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'FETCH_ERROR',
        error.message?.toString().slice(0, 200) || 'Failed to fetch packs',
      ]);
    }
  }
);

export const fetchPublicPacks = createAsyncThunk(
  'projects/fetchPublicPacks',
  async (
    {
      pageIndex = 0,
      maxPageCount = 10,
    }: { pageIndex?: number; maxPageCount?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const result = await projectService.getPublicProjects(
        pageIndex,
        maxPageCount,
        false
      ); // isProject=false for packs
      return result as unknown as Pack[]; // Backend returns projects structure but they're actually packs
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchPackById = createAsyncThunk(
  'projects/fetchPackById',
  async (packId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/projects/${packId}?isProject=false`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pack');
      }

      const result = await response.json();
      return result.data.project; // Backend returns as project but it's actually a pack
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'FETCH_ERROR',
        error.message?.toString().slice(0, 200) || 'Failed to fetch pack',
      ]);
    }
  }
);

export const updatePackStatus = createAsyncThunk(
  'projects/updatePackStatus',
  async (
    { packId, status }: { packId: string; status: Pack['status'] },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/projects/${packId}/status?isProject=false`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update pack status');
      }

      const result = await response.json();
      return result.data.project; // Backend returns as project but it's actually a pack
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'UPDATE_ERROR',
        error.message?.toString().slice(0, 200) ||
          'Failed to update pack status',
      ]);
    }
  }
);

export const deletePack = createAsyncThunk(
  'projects/deletePack',
  async (packId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/projects/${packId}?isProject=false`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete pack');
      }

      return packId;
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'DELETE_ERROR',
        error.message?.toString().slice(0, 200) || 'Failed to delete pack',
      ]);
    }
  }
);

export const fetchPackDeploymentProgress = createAsyncThunk(
  'projects/fetchPackDeploymentProgress',
  async (packId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/projects/${packId}/progress?isProject=false`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to fetch deployment progress'
        );
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'FETCH_ERROR',
        error.message?.toString().slice(0, 200) ||
          'Failed to fetch deployment progress',
      ]);
    }
  }
);

export const fetchGlobalPackParameters = createAsyncThunk(
  'projects/fetchGlobalPackParameters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.apiUrl}/projects/global-params`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to fetch global pack parameters'
        );
      }

      const result = await response.json();
      console.log('fetchGlobalPackParameters API response:', result);
      return (
        result.globalPackParams ||
        result.data?.globalPackParams ||
        result.data ||
        result
      );
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType || 'FETCH_ERROR',
        error.message?.toString().slice(0, 200) ||
          'Failed to fetch global pack parameters',
      ]);
    }
  }
);

export const fetchProfitTrending = createAsyncThunk(
  'projects/fetchProfitTrending',
  async (
    {
      projectId,
      startDate,
      endDate,
    }: { projectId: string; startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.getProfitTrending(projectId, {
        start: startDate,
        end: endDate,
      });
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

export const fetchVolumeTrending = createAsyncThunk(
  'projects/fetchVolumeTrending',
  async (
    {
      projectId,
      startDate,
      endDate,
    }: { projectId: string; startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.getVolumeTrending(projectId, {
        start: startDate,
        end: endDate,
      });
    } catch (error: any) {
      return rejectWithValue([
        error.response?.data?.errorType,
        error.response?.data?.errorMessage?.toString().slice(0, 200),
      ]);
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.projectStats = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    updateCurrentProject: (state, action: PayloadAction<Project>) => {
      state.currentProject = action.payload;
    },
    // Pack-related reducers
    clearCurrentPack: (state) => {
      state.currentPack = null;
    },
    resetDeploymentProgress: (state) => {
      state.deploymentProgress = 0;
      state.deploymentStatus = 'idle';
    },
    // Force re-render action (used for performance optimization)
    FORCE_ANALYTICS_UPDATE: (state) => {
      // Just update a timestamp to force re-render without changing data
      if (state.projectStats) {
        // Add a timestamp to force a reference change without modifying actual data
        state.projectStats = {
          ...state.projectStats,
          _lastUpdateTimestamp: Date.now(),
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch public projects
      .addCase(fetchPublicProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchPublicProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single project
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update project status
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch volume data
      .addCase(fetchVolumeData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVolumeData.fulfilled, (state, action) => {
        state.volumeData = action.payload;
        state.loading = false;
      })
      .addCase(fetchVolumeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch project stats
      .addCase(fetchProjectStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.loading = false;
        const stats = action.payload;

        // Ensure we have a valid timeRange
        const timeRange = stats.timeRange || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        };

        state.projectStats = {
          ...stats,
          metrics: {
            ...stats.metrics,
            lastUpdate: stats.metrics.lastUpdate,
          },
          timeRange: {
            start: timeRange.start,
            end: timeRange.end,
          },
        };
      })
      .addCase(fetchProjectStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch recent activity
      .addCase(fetchRecentActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.loading = false;
        // Add debugging logs

        if (!state.projectStats) {
          // Initialize projectStats if it doesn't exist
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              tradingVolume: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date(),
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            recentActivity: action.payload as ActivityLog[],
            botPerformance: [],
            trends: {
              profitTrend: [],
              volumeTrend: [],
            },
          };
        } else {
          state.projectStats.recentActivity = action.payload as ActivityLog[];
        }
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Add debugging logs
        console.error(
          'fetchRecentActivity rejected with error:',
          action.payload
        );
      })

      // Fetch bot performance
      .addCase(fetchBotPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBotPerformance.fulfilled, (state, action) => {
        state.loading = false;
        // Add debugging logs

        if (!state.projectStats) {
          // Initialize projectStats if it doesn't exist
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              tradingVolume: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date(),
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            recentActivity: [],
            trends: {
              profitTrend: [],
              volumeTrend: [],
            },
            botPerformance: [],
          };

          // The API returns data.data format, so we need to extract it
          // Check if the payload has data.data structure
          if (action.payload && 'data' in action.payload) {
            // Handle the ApiResponse<BotPerformanceHistory[]> case
            state.projectStats.botPerformance = action.payload
              .data as unknown as BotPerformanceHistory[];
          } else {
            // Direct array response
            state.projectStats.botPerformance =
              action.payload as unknown as BotPerformanceHistory[];
          }
        } else {
          // The API returns data.data format, so we need to extract it
          // Check if the payload has data.data structure
          if (action.payload && 'data' in action.payload) {
            // Handle the ApiResponse<BotPerformanceHistory[]> case
            state.projectStats.botPerformance = action.payload
              .data as unknown as BotPerformanceHistory[];
          } else {
            // Direct array response
            state.projectStats.botPerformance =
              action.payload as unknown as BotPerformanceHistory[];
          }
        }
      })
      .addCase(fetchBotPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Add debugging logs
        console.error(
          'fetchBotPerformance rejected with error:',
          action.payload
        );
      })

      // Fetch native currency price
      .addCase(fetchNativeCurrencyPrice.pending, (state) => {
        state.nativeCurrencyLoading = true;
      })
      .addCase(fetchNativeCurrencyPrice.fulfilled, (state, action) => {
        state.nativeCurrencyLoading = false;
        state.nativeCurrencyPrice = action.payload;
      })
      .addCase(fetchNativeCurrencyPrice.rejected, (state, action) => {
        state.nativeCurrencyLoading = false;
        state.error = action.payload as string;
      })

      // Fetch global metrics
      .addCase(fetchGlobalMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.globalMetrics = action.payload;
      })
      .addCase(fetchGlobalMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch profit trending
      .addCase(fetchProfitTrending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfitTrending.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.projectStats) {
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              tradingVolume: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date(),
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            recentActivity: [],
            botPerformance: [],
            trends: {
              profitTrend: action.payload,
              volumeTrend: [],
            },
          };
        } else {
          state.projectStats.trends.profitTrend = action.payload;
        }
      })
      .addCase(fetchProfitTrending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch volume trending
      .addCase(fetchVolumeTrending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVolumeTrending.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.projectStats) {
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              tradingVolume: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date(),
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            recentActivity: [],
            botPerformance: [],
            trends: {
              profitTrend: [],
              volumeTrend: action.payload,
            },
          };
        } else {
          state.projectStats.trends.volumeTrend = action.payload;
        }
      })
      .addCase(fetchVolumeTrending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Pack-related extraReducers
      // Create pack
      .addCase(createPack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPack.fulfilled, (state, action) => {
        state.loading = false;
        state.packs.push(action.payload);
        state.currentPack = action.payload;
      })
      .addCase(createPack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch packs
      .addCase(fetchPacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPacks.fulfilled, (state, action) => {
        state.loading = false;
        state.packs = action.payload;
      })
      .addCase(fetchPacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch public packs
      .addCase(fetchPublicPacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicPacks.fulfilled, (state, action) => {
        state.loading = false;
        state.packs = action.payload as Pack[];
      })
      .addCase(fetchPublicPacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch pack by ID
      .addCase(fetchPackById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPack = action.payload;
      })
      .addCase(fetchPackById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update pack status
      .addCase(updatePackStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePackStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPack = action.payload;
        const index = state.packs.findIndex(
          (pack) => pack._id === updatedPack._id
        );
        if (index !== -1) {
          state.packs[index] = updatedPack;
        }
        if (state.currentPack?._id === updatedPack._id) {
          state.currentPack = updatedPack;
        }
      })
      .addCase(updatePackStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete pack
      .addCase(deletePack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePack.fulfilled, (state, action) => {
        state.loading = false;
        const packId = action.payload;
        state.packs = state.packs.filter((pack) => pack._id !== packId);
        if (state.currentPack?._id === packId) {
          state.currentPack = null;
        }
      })
      .addCase(deletePack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch deployment progress
      .addCase(fetchPackDeploymentProgress.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchPackDeploymentProgress.fulfilled, (state, action) => {
        state.deploymentProgress = action.payload.progress;
        state.deploymentStatus = action.payload.status;
      })
      .addCase(fetchPackDeploymentProgress.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch global pack parameters
      .addCase(fetchGlobalPackParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalPackParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.globalPackParameters = action.payload;
      })
      .addCase(fetchGlobalPackParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentProject,
  clearError,
  updateProjects,
  updateCurrentProject,
  clearCurrentPack,
  resetDeploymentProgress,
} = projectSlice.actions;
export default projectSlice.reducer;

// Export types for external use
export type { Pack, PackData };

// Utility function to check global metrics state (for debugging)
export const checkGlobalMetricsState = (state: any) => {
  const globalMetrics = state.projects.globalMetrics;
  return globalMetrics;
};
