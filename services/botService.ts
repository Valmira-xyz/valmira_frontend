import api from './walletApi';
import { BotType } from '@/store/slices/botSlice';

// Define API response type
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface BotResponse {
  _id: string;
  isEnabled: boolean;
  projectId: string;
  userId: string;
  bnbBalance: number;
  estimatedFee: number;
  subWalletIds: any[];
  botType: BotType;
  status: string;
  createdAt: string;
  updatedAt: string;
  depositWalletId: {
    _id: string;
    publicKey: string;
    botType: string;
    role: string;
    userId: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  __v: number;
  tokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
}

// Add new interfaces for snipe operations
export interface SnipeSimulationResult {
  success: boolean;
  data: {
    totalBnbNeeded: number;
    depositWalletRequirements: {
      currentBnb: number;
      currentToken: number;
      bnbNeeded: number;
      bnbForLiquidity?: number;
      bnbForTip: number;
      bnbForDistribution: number;
      tokenAmountRequired: number;
      gasCost: number;
    };
    subWalletRequirements: {
      address: string;
      bnbBalance: number;
      tokenAmount: number;
      bnbToSpend: number;
      bnbNeeded: number;
    }[];
    estimatedGasCosts: {
      tipTransactionGas: number;
      addLiquidityGas?: number;
      openTradingGas?: number;
      snipeGas: number;
      distributionGas: number;
    };
    poolSimulation: {
      initialReserves: {
        bnb: number;
        token: number;
      };
      finalReserves: {
        bnb: number;
        token: number;
      };
      priceImpact: number;
    };
    gasPrice: number;
  };
  error?: string;
}

export interface ExecuteSnipeResult {
  success: boolean;
  data?: {
    bundleHash?: string;
    transactions?: string[];
  };
  error?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  withCredentials: true,
});

export class BotService {
  /**
   * Toggle a bot's enabled status
   */
  static async toggleBot(botId: string, enabled: boolean): Promise<BotResponse> {
    const response = await api.put<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/${botId}/toggle`, 
      { enabled },
      getAuthHeaders()
    );
    return response.data.data;
  }

  /**
   * Get details for a specific bot
   */
  static async getBotById(botId: string): Promise<BotResponse> {
    const response = await api.get<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/${botId}`,
      getAuthHeaders()
    );
    return response.data.data;
  }

  /**
   * Get all bots for a project
   */
  static async getProjectBots(projectId: string): Promise<BotResponse[]> {
    const response = await api.get<ApiResponse<BotResponse[]>>(
      `${BACKEND_URL}/bots/project/${projectId}`,
      getAuthHeaders()
    );
    return response.data.data;
  }

  /**
   * Enable an addon bot for a project
   */
  static async enableAddonBot(
    projectId: string, 
    addonType: BotType
  ): Promise<BotResponse> {
    const response = await api.put<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/project/${projectId}/addons/${addonType}/enable`, 
      {},
      getAuthHeaders()
    );
    return response.data.data;
  }

  /**
   * Toggle a bot's enabled status or create it if it doesn't exist
   */
  static async toggleOrCreateBot(
    projectId: string, 
    botType: BotType, 
    enabled: boolean
  ): Promise<BotResponse> {
    try {
      // First, try to get the bot ID if we have it
      const botsResponse = await this.getProjectBots(projectId);
      
      // Check if botsResponse is an array before using find
      if (Array.isArray(botsResponse)) {
        // Find the specific bot by type
        const bot = botsResponse.find(b => b.botType === botType);
        
        if (bot && bot._id) {
          // If we have the bot ID, use the toggle endpoint
          return await this.toggleBot(bot._id, enabled);
        }
      }
      
      // If the bot doesn't exist yet or botsResponse is not an array, use the enable addon endpoint
      return await this.enableAddonBot(projectId, botType);
    } catch (error) {
      console.error('Error toggling or creating bot:', error);
      throw error;
    }
  }

  /**
   * Estimate fees for sniping operation
   */
  static async estimateSnipeFees(params: {
    projectId: string;
    botId: string;
    depositWallet: string;
    subWallets: string[];
    tokenAmounts2Buy: number[];
    tokenAddress: string;
    addInitialLiquidity: boolean;
    bnbForLiquidity?: number;
    tokenAmountForLiquidity?: number;
  }): Promise<SnipeSimulationResult> {
    const response = await api.post<SnipeSimulationResult>(
      `${BACKEND_URL}/snipe/estimateFees`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Distribute BNB to sub-wallets
   */
  static async distributeBnb(params: {
    subWallets: string[];
    amounts: number[];
  }): Promise<{ success: boolean; message: string }> {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `${BACKEND_URL}/snipe/distribute`,
      params,
      getAuthHeaders()
    );
    return response.data.data;
  }

  /**
   * Simulate sniping operation
   */
  static async simulateSnipe(params: {
    projectId: string;
    botId: string;
    depositWallet: string;
    subWallets: string[];
    tokenAddress: string;
    snipeAmountPercent: number;
    addInitialLiquidity: boolean;
    bnbForLiquidity?: number;
    tokenAmountForLiquidity?: number;
  }): Promise<ExecuteSnipeResult> {
    const response = await api.post<ExecuteSnipeResult>(
      `${BACKEND_URL}/snipe/simulate`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Execute sniping operation
   */
  static async executeSnipe(params: {
    projectId: string;
    botId: string;
    depositWallet: string;
    subWallets: string[];
    tokenAddress: string;
    snipeAmountPercent: number;
    addInitialLiquidity: boolean;
    bnbForLiquidity?: number;
    tokenAmountForLiquidity?: number;
  }): Promise<ExecuteSnipeResult> {
    const response = await api.post<ExecuteSnipeResult>(
      `${BACKEND_URL}/snipe/execute`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }
} 