import axios from 'axios'
import type { Project, ApiResponse } from "@/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // Increase to 2 seconds between requests
const BATCH_DELAY = 5000; // Increase to 5 seconds between batches
const MAX_CONCURRENT_REQUESTS = 2; // Reduce to 2 concurrent requests
const ENDPOINT_COOLDOWNS = new Map<string, number>();
const ENDPOINT_SPECIFIC_DELAYS = new Map<string, number>([
  ['bnb-price', 10000], // 10 seconds for BNB price
  ['metrics/global', 15000], // 15 seconds for global metrics
  ['project-stats', 3000], // 3 seconds for project stats
]);

let lastRequestTime = 0;
let activeRequests = 0;
let requestQueue: Array<() => Promise<any>> = [];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds before retry

// Helper function to get endpoint from URL
const getEndpointKey = (url: string): string => {
  if (url.includes('bnb-price')) return 'bnb-price';
  if (url.includes('metrics/global')) return 'metrics/global';
  if (url.includes('project-stats')) return 'project-stats';
  return 'default';
};

// Helper function for rate limiting with queue and endpoint-specific delays
const waitForRateLimit = async (url: string) => {
  const now = Date.now();
  const endpointKey = getEndpointKey(url);
  const endpointDelay = ENDPOINT_SPECIFIC_DELAYS.get(endpointKey) || RATE_LIMIT_DELAY;
  const lastEndpointRequest = ENDPOINT_COOLDOWNS.get(endpointKey) || 0;
  const timeSinceLastRequest = now - lastRequestTime;
  const timeSinceEndpointRequest = now - lastEndpointRequest;

  // If we have too many active requests, wait
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }

  // If we're making requests too quickly, wait
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  // If we're making requests to the same endpoint too quickly, wait
  if (timeSinceEndpointRequest < endpointDelay) {
    await new Promise(resolve => setTimeout(resolve, endpointDelay - timeSinceEndpointRequest));
  }

  lastRequestTime = Date.now();
  ENDPOINT_COOLDOWNS.set(endpointKey, Date.now());
};

// Helper function for retrying failed requests with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  url?: string
): Promise<T> => {
  try {
    activeRequests++;
    if (url) {
      await waitForRateLimit(url);
    }
    const result = await operation();
    activeRequests--;
    return result;
  } catch (error: any) {
    activeRequests--; // Make sure to decrease counter even on error
    
    // Handle rate limit errors with exponential backoff
    if (error?.response?.status === 429) {
      if (retries === 0) {
        console.error("Max retries reached for rate limit. Throwing error:", error);
        throw error;
      }
      
      const backoffDelay = BATCH_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.warn(`Rate limit reached. Waiting ${backoffDelay}ms before retry... Retries left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return retryWithBackoff(operation, retries - 1, url);
    }
    
    if (retries === 0) {
      console.error("Max retries reached. Throwing error:", error);
      throw error;
    }
    
    const retryDelay = RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
    console.warn(`Operation failed. Retrying in ${retryDelay}ms... Retries left: ${retries - 1}`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return retryWithBackoff(operation, retries - 1, url);
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
  action?: ActivityAction;
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

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    try {
      await waitForRateLimit(`${BACKEND_URL}/projects`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects/public?pageIndex=${pageIndex}&maxPageCount=${maxPageCount}`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects/${projectId}`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects/${projectId}/status`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects/${projectId}`);
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
      await waitForRateLimit(`${BACKEND_URL}/projects/${projectId}/volume`);
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
      await waitForRateLimit(`${BACKEND_URL}/project-stats/${projectId}/activity?limit=${limit}`);
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
      await waitForRateLimit(`${BACKEND_URL}/project-stats/${projectId}/bot-performance`);
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
      
      await waitForRateLimit(`${BACKEND_URL}/project-stats/${projectId}/stats${queryParams}`);
      const statsResponse = await retryWithBackoff(async () => {
        return await axios.get<ApiResponse<ProjectStatistics>>(
          `${BACKEND_URL}/project-stats/${projectId}/stats${queryParams}`,
        );
      });

      return statsResponse.data.data;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  },

  getProfitTrending: async (projectId: string, timeRange: { start: Date; end: Date }): Promise<TimeSeriesDataPoint[]> => {
    try {
      await waitForRateLimit(`${BACKEND_URL}/project-stats/${projectId}/profit-trending`);
      const response = await retryWithBackoff(async () => {
        return await axios.get<ApiResponse<TimeSeriesDataPoint[]>>(
          `${BACKEND_URL}/project-stats/${projectId}/profit-trending`,
          {
            params: {
              startDate: timeRange.start.toISOString(),
              endDate: timeRange.end.toISOString()
            }
          }
        );
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profit trending data:', error);
      throw error;
    }
  },

  getVolumeTrending: async (projectId: string, timeRange: { start: Date; end: Date }): Promise<TimeSeriesDataPoint[]> => {
    try {
      await waitForRateLimit(`${BACKEND_URL}/project-stats/${projectId}/volume-trending`);
      const response = await retryWithBackoff(async () => {
        return await axios.get<ApiResponse<TimeSeriesDataPoint[]>>(
          `${BACKEND_URL}/project-stats/${projectId}/volume-trending`,
          {
            params: {
              startDate: timeRange.start.toISOString(),
              endDate: timeRange.end.toISOString()
            }
          }
        );
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching volume trending data:', error);
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
      return await retryWithBackoff(async () => {
        const response = await axios.get<GlobalMetrics>(
          `${BACKEND_URL}/metrics/global`
        );
        return response.data;
      }, MAX_RETRIES, 'metrics/global');
    } catch (error) {
      console.error('Error fetching global metrics:', error);
      throw error;
    }
  },

  fetchBnbPrice: async (): Promise<number> => {
    try {
      return await retryWithBackoff(async () => {
        const response = await axios.get<{
          success: boolean;
          data: {
            price: number;
            symbol: string;
            currency: string;
          }
        }>(`${BACKEND_URL}/web3/bnb-price`);
        
        if (response.data.success && response.data.data.price) {
          return response.data.data.price;
        }
        return 300; // Fallback value
      }, MAX_RETRIES, 'bnb-price');
    } catch (error) {
      console.error('Failed to fetch BNB price:', error);
      return 300; // Fallback value on error
    }
  }
} 