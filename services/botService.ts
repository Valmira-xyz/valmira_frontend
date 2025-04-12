import api from './walletApi';

import { BotType } from '@/store/slices/botSlice';

// Define API response type
interface ApiResponse<T> {
  status: string;
  message: string;
  data?: T;
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
  // Volume bot specific properties
  minBnbAmount?: number;
  maxBnbAmount?: number;
  timeSpanBetweenTransactions?: number;
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

export interface VolumeBotConfig {
  minBNBAmount: number;
  maxBNBAmount: number;
  timeSpan: number;
}

export interface ConfigureVolumeBotParams {
  projectId: string;
  botId: string;
  config: VolumeBotConfig;
}

const BACKEND_URL =
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:5000';

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
  static async toggleBot(
    botId: string,
    enabled: boolean
  ): Promise<ApiResponse<BotResponse>> {
    const response = await api.put<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/${botId}/toggle`,
      { enabled },
      getAuthHeaders()
    );
    if (!response.data) {
      throw new Error('No data returned from toggle bot API');
    }
    return response.data;
  }

  /**
   * Get details for a specific bot
   */
  static async getBotById(botId: string): Promise<BotResponse> {
    const response = await api.get<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/${botId}`,
      getAuthHeaders()
    );
    if (!response.data.data) {
      throw new Error('No data returned from get bot API');
    }
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
    if (!response.data.data) {
      return [];
    }
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
    if (!response.data.data) {
      throw new Error('No data returned from enable addon bot API');
    }
    return response.data.data;
  }

  static async startHolderBot(
    botId: string,
    projectId: string,
    tokenAddress: string,
    tokenDecimals: number
  ) {
    try {
      const response = await api.post<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/holder-bot/start`,
        { botId, projectId, tokenAddress, tokenDecimals },
        getAuthHeaders()
      );
      return response.data.data;
    } catch (err) {
      console.error('Error starting holder bot:', err);
      throw err;
    }
  }

  /**
   * Toggle a bot's enabled status or create it if it doesn't exist
   */
  static async toggleOrCreateBot(
    botId: string,
    enabled: boolean
  ): Promise<BotResponse> {
    try {
      return (await this.toggleBot(botId, enabled)).data as BotResponse;
    } catch (error) {
      console.error('Error toggling bot:', error);
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
    signature?: {
      v: number;
      r: string;
      s: string;
    } | null;
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
    depositWallet: string;
    subWallets: string[];
    amounts: number[];
    projectId: string;
    botId: string;
  }): Promise<{
    success: {
      success: boolean;
      error?: string;
    };
    message: string;
  }> {
    const response = await api.post<{
      success: {
        success: boolean;
        error?: string;
      };
      message: string;
    }>(`${BACKEND_URL}/snipe/distribute`, params, getAuthHeaders());
    return response.data;
  }

  /**
   * Simulate sniping operation
   */
  static async simulateSnipe(params: {
    projectId: string;
    botId: string;
    depositWallet: string;
    subWallets: string[];
    tokenAmounts2Buy: number[];
    tokenAddress: string;
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
    tokenAmounts2Buy: number[];
    tokenAddress: string;
  }): Promise<ExecuteSnipeResult> {
    const response = await api.post<ExecuteSnipeResult>(
      `${BACKEND_URL}/snipe/execute`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Execute single wallet sell operation
   */
  static async singleWalletSell(params: {
    projectId: string;
    botId: string;
    walletAddress: string;
    tokenAddress: string;
    sellPercentage: number;
    slippageTolerance: number;
    targetWalletAddress?: string;
  }): Promise<{
    errorDetails: string;
    success: boolean;
    error?: string;
    errorCode?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        error?: string;
        errorCode?: string;
        errorDetails?: string;
      }>(`${BACKEND_URL}/snipe/singleSell`, params, getAuthHeaders());
      if (!response.data.success) {
        return {
          success: false,
          error:
            response.data.error ||
            'An unexpected error occurred. Please try again or contact support.',
          errorCode: response.data.errorCode || 'UNKNOWN_ERROR',
          errorDetails:
            response.data.errorDetails || 'No additional details provided.',
        };
      }
      return {
        ...response.data,
        errorDetails:
          response.data.errorDetails || 'No additional details provided.',
      };
    } catch (error) {
      console.error('Error executing single wallet sell:', error);
      return {
        success: false,
        error:
          'An unexpected error occurred. Please try again or contact support.',
        errorCode: 'UNKNOWN_ERROR',
        errorDetails:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as Error).message
            : 'Unknown error occurred.',
      };
    }
  }

  /**
   * Execute single wallet buy operation
   */
  static async singleWalletBuy(params: {
    projectId: string;
    botId: string;
    walletAddress: string;
    tokenAddress: string;
    slippageTolerance: number;
    targetWalletAddress?: string;
    bnbSpendRate?: number;
  }): Promise<{
    walletAddress: string;
    errorDetails: string;
    success: boolean;
    error?: string;
    errorCode?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        error?: string;
        errorCode?: string;
        errorDetails?: string;
      }>(`${BACKEND_URL}/snipe/singleBuy`, params, getAuthHeaders());
      if (!response.data.success) {
        return {
          walletAddress: params.walletAddress,
          success: false,
          error:
            response.data.error ||
            'An unexpected error occurred. Please try again or contact support.',
          errorCode: response.data.errorCode || 'UNKNOWN_ERROR',
          errorDetails:
            response.data.errorDetails || 'No additional details provided.',
        };
      }
      return {
        walletAddress: params.walletAddress,
        ...response.data,
        errorDetails: response.data.error || 'No additional details provided.',
      };
    } catch (error) {
      console.error('Error executing single wallet buy:', error);
      return {
        walletAddress: params.walletAddress,
        success: false,
        error:
          'An unexpected error occurred. Please try again or contact support.',
        errorCode: 'UNKNOWN_ERROR',
        errorDetails:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as Error).message
            : 'Unknown error occurred.',
      };
    }
  }

  /**
   * Execute multi wallet sell operation
   */
  static async multiWalletSell(params: {
    projectId: string;
    botId: string;
    walletAddresses: string[];
    tokenAddress: string;
    sellPercentages: number[];
    slippageTolerance: number;
    targetWalletAddress?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await api.post<{ success: boolean; error?: string }>(
      `${BACKEND_URL}/snipe/multiSell`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Execute multi wallet buy operation
   */
  static async multiWalletBuy(params: {
    projectId: string;
    botId: string;
    walletAddresses: string[];
    tokenAddress: string;
    slippageTolerance: number;
    bnbSpendRates?: number[];
    targetWalletAddress?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await api.post<{ success: boolean; error?: string }>(
      `${BACKEND_URL}/snipe/multiBuy`,
      params,
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Collect BNB from selected wallets to a target wallet
   */
  static async collectBnb(params: {
    botId: string;
    walletAddresses: string[];
    targetWallet: string;
    projectId: string;
  }): Promise<{
    success: boolean;
    walletResults?: {
      address: string;
      success: boolean;
      hash?: string;
      error?: string;
    }[];
    failedWallets?: number;
    totalSuccessful?: number;
    error?: string;
  }> {
    const response = await api.post<{
      success: boolean;
      data: {
        success: boolean;
        walletResults?: {
          address: string;
          success: boolean;
          hash?: string;
          error?: string;
        }[];
        failedWallets?: number;
        totalSuccessful?: number;
        error?: string;
      };
    }>(`${BACKEND_URL}/snipe/bnbCollect`, params, getAuthHeaders());
    return response.data.data;
  }

  /**
   * Configure AutoSell settings for wallets
   */
  static async configureAutoSell(params: {
    projectId: string;
    botId: string;
    wallets: {
      address: string;
      sellPrice: string;
      stopLoss: string;
      enabled: boolean;
    }[];
  }): Promise<{ success: boolean; error?: string }> {
    const response = await api.post<{ success: boolean; error?: string }>(
      `${BACKEND_URL}/snipe/configure-auto-sell/${params.botId}`,
      {
        projectId: params.projectId,
        wallets: params.wallets,
      },
      getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Get auto sell parameters for a specific bot
   */
  static async getAutoSellParameters(botId: string) {
    const response = await api.get<{
      success: boolean;
      data?: {
        botId: string;
        projectId: string;
        userId: string;
        status: string;
        statusReason?: string;
        wallets: {
          address: string;
          sellPrice: string;
          stopLoss: string;
          enabled: boolean;
        }[];
        countsOfActivaveWallets: number;
        isEnabled: boolean;
        depositWalletId: string;
        subWalletIds: string[];
        bnbBalance: number;
        estimatedFee: number;
        botType: string;
        totalTokenBalance: number;
        createdAt: string;
        updatedAt: string;
      };
      error?: string;
    }>(`${BACKEND_URL}/snipe/auto-sell-parameters/${botId}`, getAuthHeaders());

    return response.data;
  }

  /**
   * Configure Volume Bot parameters
   */
  static async configureVolumeBot(
    params: ConfigureVolumeBotParams
  ): Promise<ApiResponse<BotResponse>> {
    const response = await api.put<ApiResponse<BotResponse>>(
      `${BACKEND_URL}/bots/${params.botId}/volume-config`,
      params.config,
      getAuthHeaders()
    );
    if (!response.data) {
      throw new Error('No data returned from configure volume bot API');
    }
    return response.data;
  }
}
