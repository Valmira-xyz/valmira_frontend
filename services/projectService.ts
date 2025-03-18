import axios from 'axios'
import type { Project } from "@/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  withCredentials: true,
})

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

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
        `${BACKEND_URL}/projects`,
        getAuthHeaders()
      )
      return response.data.data.projects
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  getPublicProjects: async (pageIndex: number = 0, maxPageCount: number = 10): Promise<Project[]> => {
    try {
      const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
        `${BACKEND_URL}/projects/public?pageIndex=${pageIndex}&maxPageCount=${maxPageCount}`
      )
      return response.data.data.projects
    } catch (error) {
      console.error('Error fetching public projects:', error)
      throw error
    }
  },

  getProject: async (projectId: string): Promise<Project> => {
    try {
      const response = await axios.get<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects/${projectId}`
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await axios.post<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects`,
        projectData,
        getAuthHeaders()
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  updateProjectStatus: async (projectId: string, status: 'active' | 'inactive'): Promise<Project> => {
    try {
      const response = await axios.patch<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects/${projectId}/status`,
        { status },
        getAuthHeaders()
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await axios.delete(
        `${BACKEND_URL}/projects/${projectId}`,
        getAuthHeaders()
      )
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },

  getVolumeData: async (projectId: string): Promise<any> => {
    try {
      const response = await axios.get<ApiResponse<{ volumeData: any }>>(
        `${BACKEND_URL}/projects/${projectId}/volume`,
        getAuthHeaders()
      )
      return response.data.data.volumeData
    } catch (error) {
      console.error('Error fetching volume data:', error)
      throw error
    }
  },

  getRecentActivity: async (projectId: string, limit: number = 50): Promise<ActivityLog[]> => {
    try {
      const response = await axios.get<ApiResponse<ActivityLog[]>>(
        `${BACKEND_URL}/project-stats/${projectId}/activity?limit=${limit}`,
        getAuthHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  getBotPerformanceHistory: async (
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BotPerformanceHistory[]> => {
    try {
      const response = await axios.get<ApiResponse<BotPerformanceHistory[]>>(
        `${BACKEND_URL}/project-stats/${projectId}/bot-performance`,
        {
          ...getAuthHeaders(),
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        }
      );
      return response.data.data;
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
      
      const [statsResponse, activityResponse, performanceResponse] = await Promise.all([
        axios.get<ApiResponse<ProjectStatistics>>(
          `${BACKEND_URL}/project-stats/${projectId}/stats${queryParams}`,
          getAuthHeaders()
        ),
        projectService.getRecentActivity(projectId),
        projectService.getBotPerformanceHistory(
          projectId,
          timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          timeRange?.end || new Date()
        )
      ]);
      
      return {
        ...statsResponse.data.data,
        recentActivity: activityResponse,
        botPerformance: performanceResponse
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
      botName: 'LiquidationSnipeBot',
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
      botName: 'LiquidationSnipeBot',
      action: 'Remove LP',
      volume: lpTokenAmount,
      impact: 0, // Calculate impact if needed
      tokenAmount,
      bnbAmount
    });
  }
} 