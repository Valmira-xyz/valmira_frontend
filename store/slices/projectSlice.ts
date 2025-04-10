import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Project, ProjectState, ProjectStatistics } from '@/types'
import { projectService } from '@/services/projectService'
import type { BotPerformanceHistory, ActivityLog, GlobalMetrics } from '@/services/projectService'
import axios from 'axios'

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  volumeData: null,
  projectStats: null,
  bnbPrice: null,
  bnbPriceLoading: false,
  globalMetrics: null
}

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getProjects()
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchPublicProjects = createAsyncThunk(
  'projects/fetchPublic',
  async ({ pageIndex = 0, maxPageCount = 10 }: { pageIndex?: number, maxPageCount?: number } = {}, { rejectWithValue }) => {
    try {
      return await projectService.getPublicProjects(pageIndex, maxPageCount)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData: Partial<Project>, { rejectWithValue }) => {
    try {
      return await projectService.createProject(projectData)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateProjectStatus = createAsyncThunk(
  'projects/updateStatus',
  async ({ projectId, status }: { projectId: string; status: 'active' | 'inactive' }, { rejectWithValue }) => {
    try {
      return await projectService.updateProjectStatus(projectId, status)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId)
      return projectId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchVolumeData = createAsyncThunk(
  'projects/fetchVolumeData',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getVolumeData(projectId)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchProjectStats = createAsyncThunk(
  'projects/fetchStats',
  async ({ projectId, timeRange }: { projectId: string, timeRange?: { start: Date; end: Date } }, { rejectWithValue }) => {
    try {
      // Convert Date objects to ISO strings for serialization
      const serializedTimeRange = timeRange ? {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString()
      } : undefined;

      const stats = await projectService.getProjectStats(projectId, timeRange);
      
      // Return the stats as is - the dates will be handled in the reducer
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchRecentActivity = createAsyncThunk(
  'projects/fetchRecentActivity',
  async ({ 
    projectId, 
    timeRange = { 
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      end: new Date() 
    } 
  }: { 
    projectId: string, 
    timeRange?: { 
      start: Date; 
      end: Date 
    } 
  }, { rejectWithValue }) => {
    try {
      return await projectService.getRecentActivity(projectId, timeRange)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchBotPerformance = createAsyncThunk(
  'projects/fetchBotPerformance',
  async ({ projectId, startDate, endDate }: { projectId: string, startDate: Date, endDate: Date }, { rejectWithValue }) => {
    try {
      return await projectService.getBotPerformanceHistory(projectId, startDate, endDate)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchBnbPrice = createAsyncThunk(
  'projects/fetchBnbPrice',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<{
        success: boolean;
        data: {
          price: number;
          symbol: string;
          currency: string;
        }
      }>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/web3/bnb-price`);
      
      if (response.data.success && response.data.data.price) {
        return response.data.data.price;
      }
      return 300; // Fallback value
    } catch (error: any) {
      console.error('Failed to fetch BNB price:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch BNB price');
    }
  }
)

export const fetchGlobalMetrics = createAsyncThunk(
  'projects/fetchGlobalMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const result = await projectService.getGlobalMetrics();
      return result;
    } catch (error: any) {
      console.error('Failed to fetch global metrics:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
)

export const fetchProfitTrending = createAsyncThunk(
  'projects/fetchProfitTrending',
  async ({ projectId, startDate, endDate }: { projectId: string, startDate: Date, endDate: Date }, { rejectWithValue }) => {
    try {
      return await projectService.getProfitTrending(projectId, { start: startDate, end: endDate })
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchVolumeTrending = createAsyncThunk(
  'projects/fetchVolumeTrending',
  async ({ projectId, startDate, endDate }: { projectId: string, startDate: Date, endDate: Date }, { rejectWithValue }) => {
    try {
      return await projectService.getVolumeTrending(projectId, { start: startDate, end: endDate })
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null
      state.projectStats = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload
    },
    updateCurrentProject: (state, action: PayloadAction<Project>) => {
      state.currentProject = action.payload
    },
    // Force re-render action (used for performance optimization)
    FORCE_ANALYTICS_UPDATE: (state) => {
      // Just update a timestamp to force re-render without changing data
      if (state.projectStats) {
        // Add a timestamp to force a reference change without modifying actual data
        state.projectStats = {
          ...state.projectStats,
          _lastUpdateTimestamp: Date.now()
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch public projects
      .addCase(fetchPublicProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPublicProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchPublicProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single project
      .addCase(fetchProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false
        state.currentProject = action.payload
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false
        state.projects.push(action.payload)
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Update project status
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.projects.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false
        state.projects = state.projects.filter(p => p._id !== action.payload)
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch volume data
      .addCase(fetchVolumeData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVolumeData.fulfilled, (state, action) => {
        state.volumeData = action.payload
        state.loading = false
      })
      .addCase(fetchVolumeData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch project stats
      .addCase(fetchProjectStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.loading = false
        const stats = action.payload;
        
        // Ensure we have a valid timeRange
        const timeRange = stats.timeRange || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        };

        state.projectStats = {
          ...stats,
          metrics: {
            ...stats.metrics,
            lastUpdate: stats.metrics.lastUpdate
          },
          timeRange: {
            start: timeRange.start,
            end: timeRange.end
          }
        };
      })
      .addCase(fetchProjectStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch recent activity
      .addCase(fetchRecentActivity.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.loading = false
        // Add debugging logs
        
        if (!state.projectStats) {
          // Initialize projectStats if it doesn't exist
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              volume24h: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date()
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date()
            },
            recentActivity: action.payload as ActivityLog[],
            botPerformance: [],
            trends: {
              profitTrend: [],
              volumeTrend: []
            }
          }
        } else {
          state.projectStats.recentActivity = action.payload as ActivityLog[]
        }
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // Add debugging logs
        console.error("fetchRecentActivity rejected with error:", action.payload)
      })

      // Fetch bot performance
      .addCase(fetchBotPerformance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBotPerformance.fulfilled, (state, action) => {
        state.loading = false
        // Add debugging logs
        
        if (!state.projectStats) {
          // Initialize projectStats if it doesn't exist
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              volume24h: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date()
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date()
            },
            recentActivity: [],
            trends: {
              profitTrend: [],
              volumeTrend: []
            },
            botPerformance: []
          }
          
          // The API returns data.data format, so we need to extract it
          // Check if the payload has data.data structure
          if (action.payload && 'data' in action.payload) {
            // Handle the ApiResponse<BotPerformanceHistory[]> case
            state.projectStats.botPerformance = action.payload.data as unknown as BotPerformanceHistory[]
          } else {
            // Direct array response
            state.projectStats.botPerformance = action.payload as unknown as BotPerformanceHistory[]
          }
          
        } else {
          // The API returns data.data format, so we need to extract it
          // Check if the payload has data.data structure
          if (action.payload && 'data' in action.payload) {
            // Handle the ApiResponse<BotPerformanceHistory[]> case
            state.projectStats.botPerformance = action.payload.data as unknown as BotPerformanceHistory[]
          } else {
            // Direct array response
            state.projectStats.botPerformance = action.payload as unknown as BotPerformanceHistory[]
          }
        }
      })
      .addCase(fetchBotPerformance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // Add debugging logs
        console.error("fetchBotPerformance rejected with error:", action.payload)
      })

      // Fetch BNB price
      .addCase(fetchBnbPrice.pending, (state) => {
        state.bnbPriceLoading = true;
        state.error = null;
      })
      .addCase(fetchBnbPrice.fulfilled, (state, action) => {
        state.bnbPriceLoading = false;
        state.bnbPrice = action.payload;
      })
      .addCase(fetchBnbPrice.rejected, (state, action) => {
        state.bnbPriceLoading = false;
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
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfitTrending.fulfilled, (state, action) => {
        state.loading = false
        if (!state.projectStats) {
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              volume24h: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date()
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date()
            },
            recentActivity: [],
            botPerformance: [],
            trends: {
              profitTrend: action.payload,
              volumeTrend: []
            }
          }
        } else {
          state.projectStats.trends.profitTrend = action.payload
        }
      })
      .addCase(fetchProfitTrending.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch volume trending
      .addCase(fetchVolumeTrending.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVolumeTrending.fulfilled, (state, action) => {
        state.loading = false
        if (!state.projectStats) {
          state.projectStats = {
            metrics: {
              cumulativeProfit: 0,
              volume24h: 0,
              activeBots: 0,
              liquidity: 0,
              lastUpdate: new Date()
            },
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date()
            },
            recentActivity: [],
            botPerformance: [],
            trends: {
              profitTrend: [],
              volumeTrend: action.payload
            }
          }
        } else {
          state.projectStats.trends.volumeTrend = action.payload
        }
      })
      .addCase(fetchVolumeTrending.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { clearCurrentProject, clearError, updateProjects, updateCurrentProject } = projectSlice.actions
export default projectSlice.reducer 

// Utility function to check global metrics state (for debugging)
export const checkGlobalMetricsState = (state: any) => {
  const globalMetrics = state.projects.globalMetrics;
  return globalMetrics;
} 