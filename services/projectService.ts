import axios from 'axios'
import type { Project, ApiResponse } from "@/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 500; // 500ms between requests
const BATCH_DELAY = 2000; // 2 seconds between batches of requests
let lastRequestTime = 0;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds before retry

// Helper function for rate limiting
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    // console.log(`Rate limit active. Waiting for ${RATE_LIMIT_DELAY - timeSinceLastRequest}ms`);
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Helper function for retrying failed requests
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Don't retry if it's a 429 error - just wait longer and let the caller retry
    if (error?.response?.status === 429) {
      console.warn("Rate limit (429) reached. Consider slowing down your requests.");
      // Wait longer for 429 errors
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      throw error;
    }
    
    if (retries === 0) {
      console.error("Max retries reached. Throwing error:", error);
      throw error;
    }
    
    console.warn(`Operation failed. Retrying in ${RETRY_DELAY}ms... Retries left: ${retries - 1}`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryWithBackoff(operation, retries - 1);
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
}

export type ActivityAction = 
  | 'Add LP' 
  | 'Remove LP' 
  | 'Buy' 
  | 'Sell' 
  | 'Hold' 
  | 'Token Sniped' 
  | 'Token Sold' 
  | 'Single Wallet Sell' 
  | 'Fees Estimated' 
  | 'Snipe Simulated';

export interface ActivityLog {
  timestamp: Date;
  botName: string;
  action: ActivityAction;
  volume: number;
  impact: number;
  tokenAmount?: number;
  bnbAmount?: number;
}

export interface BotPerformanceHistory {
  botId: string;
  botName: string;
  status: 'Active' | 'Inactive' | 'Error';
  trades: number;
  profit: number;
  uptime: string;
  date: string;
  profitContribution: number;
  lastUpdated: Date;
}

export interface ProjectStatistics {
  metrics: {
    cumulativeProfit: number;
    volume24h: number;
    activeBots: number;
    liquidity: number;
    lastUpdate: Date;
  };
  trends: {
    profitTrend: Array<{ timestamp: number; value: number }>;
    volumeTrend: Array<{ timestamp: number; value: number }>;
  };
  botPerformance: BotPerformanceHistory[];
  recentActivity: ActivityLog[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface GlobalMetrics {
  totalProjects: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  totalFundsManaged: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  aggregateTradingVolume: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  activeBotsRunning: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  aggregateProfits: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  lastUpdated: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
          `${BACKEND_URL}/projects`,
          getAuthHeaders()
        )
        return response.data.data.projects
      });
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  getPublicProjects: async (pageIndex: number = 0, maxPageCount: number = 10): Promise<Project[]> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
          `${BACKEND_URL}/projects/public?pageIndex=${pageIndex}&maxPageCount=${maxPageCount}`
        )
        return response.data.data.projects
      });
    } catch (error) {
      console.error('Error fetching public projects:', error)
      throw error
    }
  },

  getProject: async (projectId: string): Promise<Project> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<{ project: Project }>>(
          `${BACKEND_URL}/projects/${projectId}`
        )
        return response.data.data.project
      });
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.post<ApiResponse<{ project: Project }>>(
          `${BACKEND_URL}/projects`,
          projectData,
          getAuthHeaders()
        )
        return response.data.data.project
      });
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  updateProjectStatus: async (projectId: string, status: 'active' | 'inactive'): Promise<Project> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.patch<ApiResponse<{ project: Project }>>(
          `${BACKEND_URL}/projects/${projectId}/status`,
          { status },
          getAuthHeaders()
        )
        return response.data.data.project
      });
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await waitForRateLimit();
      await retryWithBackoff(async () => {
        await axios.delete(
          `${BACKEND_URL}/projects/${projectId}`,
          getAuthHeaders()
        )
      });
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },

  getVolumeData: async (projectId: string): Promise<any> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<{ volumeData: any }>>(
          `${BACKEND_URL}/projects/${projectId}/volume`,
          getAuthHeaders()
        )
        return response.data.data.volumeData
      });
    } catch (error) {
      console.error('Error fetching volume data:', error)
      throw error
    }
  },

  getRecentActivity: async (projectId: string, limit: number = 50): Promise<ActivityLog[]> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<ActivityLog[]>>(
          `${BACKEND_URL}/project-stats/${projectId}/activity?limit=${limit}`,
        );
        return response.data.data;
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  getBotPerformanceHistory: async (
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<BotPerformanceHistory[]>> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<ApiResponse<BotPerformanceHistory[]>>(
          `${BACKEND_URL}/project-stats/${projectId}/bot-performance`,
          {
            params: {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            }
          }
        );
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching bot performance history:', error);
      throw error;
    }
  },

  getProjectStats: async (projectId: string, timeRange?: { start: Date; end: Date }): Promise<ProjectStatistics> => {
    try {
      // First, get the basic stats
      const queryParams = timeRange ? 
        `?startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}` : '';
      
      // Add rate limiting and sequential requests instead of Promise.all to avoid rate limits
      await waitForRateLimit();
      const statsResponse = await retryWithBackoff(async () => {
        return await axios.get<ApiResponse<ProjectStatistics>>(
          `${BACKEND_URL}/project-stats/${projectId}/stats${queryParams}`,
        );
      });

      // // Wait a bit before the next request
      // await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      // await waitForRateLimit();
      // const activityResponse = await projectService.getRecentActivity(projectId);
      
      // // Wait again before the final request
      // await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      // await waitForRateLimit();
      // const performanceResponse = await projectService.getBotPerformanceHistory(
      //   projectId,
      //   timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      //   timeRange?.end || new Date()
      // );
      
      return {
        ...statsResponse.data.data
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  },

  /**
   * Add an activity log entry for a project
   * @param projectId - The ID of the project
   * @param activity - The activity log entry to add
   */
  addActivityLog: async (projectId: string, activity: ActivityLog): Promise<void> => {
    try {
      await axios.post(
        `${BACKEND_URL}/project-stats/${projectId}/activity`,
        activity,
        getAuthHeaders()
      );
    } catch (error) {
      console.error('Error posting activity log:', error);
      throw error;
    }
  },

  /**
   * Log LP addition activity
   */
  logLPAddition: async (projectId: string, tokenAmount: number, bnbAmount: number): Promise<void> => {
    return projectService.addActivityLog(projectId, {
      timestamp: new Date(),
      botName: 'SnipeBot',
      action: 'Add LP',
      volume: bnbAmount,
      impact: 0, // Calculate impact if needed
      tokenAmount,
      bnbAmount
    });
  },

  /**
   * Log LP removal activity
   */
  logLPRemoval: async (projectId: string, tokenAmount: number, bnbAmount: number, lpTokenAmount: number): Promise<void> => {
    return projectService.addActivityLog(projectId, {
      timestamp: new Date(),
      botName: 'SnipeBot',
      action: 'Remove LP',
      volume: lpTokenAmount,
      impact: 0, // Calculate impact if needed
      tokenAmount,
      bnbAmount
    });
  },

  /**
   * Get global metrics for the platform from the dedicated endpoint
   * @returns GlobalMetrics object with platform-wide metrics
   */
  getGlobalMetrics: async (): Promise<GlobalMetrics> => {
    try {
      await waitForRateLimit();
      return await retryWithBackoff(async () => {
        const response = await axios.get<GlobalMetrics>(
          `${BACKEND_URL}/metrics/global`
        );
        return response.data;
      });
    } catch (error) {
      console.error('Error fetching global metrics:', error);
      throw error;
    }
  }
} 