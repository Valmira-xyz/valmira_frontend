import { config } from './config';
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
  nativeBalance: number;
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
  minNativeAmount?: number;
  maxNativeAmount?: number;
  timeSpanBetweenTransactions?: number;
  chainName?: string;
}

// Add new interfaces for snipe operations
export interface SnipeSimulationResult {
  success: boolean;
  data: {
    totalNativeForSwap: number;
    depositWalletRequirements: {
      currentNative: number;
      currentToken: number;
      depositWalletNativeInsufficient: number;
      nativeForDistribution: number;
      nativeForLiquidity?: number;
      nativeForTip: number;
      tokenAmountRequired: number;
      gasCost: number;
    };
    subWalletRequirements: {
      address: string;
      nativeBalance: number;
      nativeFinalInsufficient: number;
      nativeToSpend: number;
      tokenAmount: number;
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
        native: number;
        token: number;
      };
      finalReserves: {
        native: number;
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
  minNativeAmount: number;
  maxNativeAmount: number;
  timeSpan: number;
  chainName: string;
}

export interface ConfigureVolumeBotParams {
  projectId: string;
  botId: string;
  config: VolumeBotConfig;
}

export interface HolderBotConfig {
  targetHolders: number;
  botId: string;
  projectId: string;
  tokenAddress: string;
  chainName: string;
}

export interface ConfigureHolderBotParams {
  projectId: string;
  botId: string;
  config: HolderBotConfig;
}

export interface TrendingBotConfig {
  minNativeAmount: number;
  maxNativeAmount: number;
  upwardSellRateMin: number;
  upwardSellRateMax: number;
  downwardSellRateMin: number;
  downwardSellRateMax: number;
  timeSpanBetweenTransactions: number;
  trend: 'upward' | 'downward';
  targetMinutes: number;
}

export interface ConfigureTrendingBotParams {
  projectId: string;
  botId: string;
  config: TrendingBotConfig;
}

export interface DistributionBotConfig {
  status: 'Active' | 'Inactive';
  distributionStyle: {
    type: 'random' | 'equal';
    randomAmount?: {
      min: number;
      max: number;
    };
    equalAmount?: number;
  };
  timeSpanBetweenTransactions: number;
  totalDistributions: number;
}

export interface ConfigureDistributionBotParams {
  projectId: string;
  botId: string;
  config: DistributionBotConfig;
}

export interface UpdatePackEnabledParams {
  packId: string;
  enabled: boolean;
  chainName: string;
}

const BACKEND_URL = config.apiUrl;

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
    try {
      const response = await api.get<ApiResponse<BotResponse[]>>(
        `${BACKEND_URL}/bots/project/${projectId}`,
        getAuthHeaders()
      );
      if (!response.data.data) {
        return [];
      }
      return response.data.data;
    } catch (error) {
      console.error('Error getting project bots:', error);
      throw error;
    }
  }

  /**
   * Enable an addon bot for a project
   */
  static async enableAddonBot(
    projectId: string,
    addonType: BotType
  ): Promise<BotResponse> {
    try {
      const response = await api.put<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/project/${projectId}/addons/${addonType}/enable`,
        {},
        getAuthHeaders()
      );
      if (!response.data.data) {
        throw new Error('No data returned from enable addon bot API');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error enabling addon bot:', error);
      throw error;
    }
  }

  static async startHolderBot(
    botId: string,
    projectId: string,
    tokenAddress: string,
    tokenDecimals: number,
    chainName: string
  ) {
    try {
      const response = await api.post<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/holder-bot/start`,
        { botId, projectId, tokenAddress, tokenDecimals, chainName },
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
  static async sendPassiveSnipeRequest(params: {
    botId: string;
    walletCount: number;
    tokenAmount: number;
    tokenAddress: string;
    pairAddress: string;
    symbol: string;
    chainName: string;
    expirationTime: number;
    priceThreshold: number;
    maxSlippage: number;
  }): Promise<any> {
    try {
      const response = await api.post<any>(
        `${BACKEND_URL}/snipe/passive-snipe`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error sending passive snipe request:', error);
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
    chainName: string;
    signature?: {
      v: number;
      r: string;
      s: string;
    } | null;
  }): Promise<SnipeSimulationResult> {
    try {
      const response = await api.post<SnipeSimulationResult>(
        `${BACKEND_URL}/snipe/estimateFees`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error estimating snipe fees:', error);
      throw error;
    }
  }

  /**
   * All in one snipe operation
   */
  static async allInOneSnipe(params: {
    projectId: string;
    botId: string;
    depositWallet: string;
    subWallets: string[];
    tokenAmounts2Buy: number[];
    tokenAddress: string;
    chainName: string;
    signature?: {
      v: number;
      r: string;
      s: string;
    } | null;
  }): Promise<any> {
    try {
      const response = await api.post<any>(
        `${BACKEND_URL}/snipe/all-in-one-snipe`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error all in one snipe:', error);
      throw error;
    }
  }

  /**
   * Distribute Native to sub-wallets
   */
  static async distributeNative(params: {
    depositWallet: string;
    subWallets: string[];
    amounts: number[];
    projectId: string;
    botId: string;
    chainName: string;
  }): Promise<{
    success: {
      success: boolean;
      error?: string;
    };
    message: string;
  }> {
    try {
      const response = await api.post<{
        success: {
          success: boolean;
          error?: string;
        };
        message: string;
      }>(`${BACKEND_URL}/snipe/distribute`, params, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error distributing Native:', error);
      throw error;
    }
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
    chainName: string;
    signature?: {
      v: number;
      r: string;
      s: string;
    } | null;
  }): Promise<ExecuteSnipeResult> {
    try {
      const response = await api.post<ExecuteSnipeResult>(
        `${BACKEND_URL}/snipe/simulate`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error simulating snipe:', error);
      throw error;
    }
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
    chainName: string;
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
    chainName: string;
  }): Promise<any> {
    try {
      const response = await api.post<{
        success: boolean;
        error?: string;
        errorCode?: string;
        errorDetails?: string;
      }>(`${BACKEND_URL}/snipe/singleSell`, params, getAuthHeaders());
      return response.data;
      // if (!response.data.success) {
      //   return {
      //     success: false,
      //     error:
      //       response.data.error ||
      //       'An unexpected error occurred. Please try again or contact support.',
      //     errorCode: response.data.errorCode || 'UNKNOWN_ERROR',
      //     errorDetails:
      //       response.data.errorDetails || 'No additional details provided.',
      //   };
      // }
      // return {
      //   ...response.data,
      //   errorDetails:
      //     response.data.errorDetails || 'No additional details provided.',
      // };
    } catch (error) {
      console.error('Error executing single wallet sell:', error);
      throw error;
      // return {
      //   success: false,
      //   error:
      //     'An unexpected error occurred. Please try again or contact support.',
      //   errorCode: 'UNKNOWN_ERROR',
      //   errorDetails:
      //     typeof error === 'object' && error !== null && 'message' in error
      //       ? (error as Error).message
      //       : 'Unknown error occurred.',
      // };
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
    nativeSpendRate?: number;
    chainName: string;
  }): Promise<any> {
    try {
      const response = await api.post<{
        success: boolean;
        error?: string;
        errorCode?: string;
        errorDetails?: string;
      }>(`${BACKEND_URL}/snipe/singleBuy`, params, getAuthHeaders());
      return response.data;
      // if (!response.data.success) {
      //   return {
      //     walletAddress: params.walletAddress,
      //     success: false,
      //     error:
      //       response.data.error ||
      //       'An unexpected error occurred. Please try again or contact support.',
      //     errorCode: response.data.errorCode || 'UNKNOWN_ERROR',
      //     errorDetails:
      //       response.data.errorDetails || 'No additional details provided.',
      //   };
      // }
      // return {
      //   walletAddress: params.walletAddress,
      //   ...response.data,
      //   errorDetails: response.data.error || 'No additional details provided.',
      // };
    } catch (error) {
      console.error('Error executing single wallet buy:', error);
      throw error;
      // return {
      //   walletAddress: params.walletAddress,
      //   success: false,
      //   error:
      //     'An unexpected error occurred. Please try again or contact support.',
      //   errorCode: 'UNKNOWN_ERROR',
      //   errorDetails:
      //     typeof error === 'object' && error !== null && 'message' in error
      //       ? (error as Error).message
      //       : 'Unknown error occurred.',
      // };
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
    chainName: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ success: boolean; error?: string }>(
        `${BACKEND_URL}/snipe/multiSell`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error executing multi wallet sell:', error);
      throw error;
    }
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
    nativeSpendRates?: number[];
    targetWalletAddress?: string;
    chainName: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ success: boolean; error?: string }>(
        `${BACKEND_URL}/snipe/multiBuy`,
        params,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error executing multi wallet buy:', error);
      throw error;
    }
  }

  /**
   * Collect Native Currency from selected wallets to a target wallet
   */
  static async collectNative(params: {
    botId: string;
    walletAddresses: string[];
    targetWallet: string;
    projectId: string;
    chainName: string;
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
    try {
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
      }>(`${BACKEND_URL}/snipe/nativeCollect`, params, getAuthHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Error collecting native currency:', error);
      throw error;
    }
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
    try {
      const response = await api.post<{ success: boolean; error?: string }>(
        `${BACKEND_URL}/snipe/configure-auto-sell/${params.botId}`,
        {
          projectId: params.projectId,
          wallets: params.wallets,
        },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error configuring auto sell:', error);
      throw error;
    }
  }

  /**
   * Get auto sell parameters for a specific bot
   */
  static async getAutoSellParameters(botId: string) {
    try {
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
          nativeBalance: number;
          estimatedFee: number;
          botType: string;
          totalTokenBalance: number;
          createdAt: string;
          updatedAt: string;
        };
        error?: string;
      }>(
        `${BACKEND_URL}/snipe/auto-sell-parameters/${botId}`,
        getAuthHeaders()
      );

      return response.data;
    } catch (error) {
      console.error('Error getting auto sell parameters:', error);
      throw error;
    }
  }

  /**
   * Configure Volume Bot parameters
   */
  static async configureVolumeBot(
    params: ConfigureVolumeBotParams
  ): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await api.put<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/${params.botId}/volume-config`,
        params.config,
        getAuthHeaders()
      );
      if (!response.data) {
        throw new Error('No data returned from configure volume bot API');
      }
      return response.data;
    } catch (error) {
      console.error('Error configuring volume bot:', error);
      throw error;
    }
  }

  /**
   * Configure Holder Bot parameters
   */
  static async configureHolderBot(
    params: ConfigureHolderBotParams
  ): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await api.put<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/${params.botId}/holder-config`,
        params.config,
        getAuthHeaders()
      );
      if (!response.data) {
        throw new Error('No data returned from configure holder bot API');
      }
      return response.data;
    } catch (error) {
      console.error('Error configuring holder bot:', error);
      throw error;
    }
  }

  /**
   * Configure Trending Bot parameters
   */
  static async configureTrendingBot(
    botId: string,
    config: TrendingBotConfig
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/${botId}/trending-config`,
        config,
        getAuthHeaders()
      );
      if (!response.data) {
        throw new Error('No data returned from configure trending bot API');
      }
      return { success: true };
    } catch (error) {
      console.error('Error configuring trending bot:', error);
      throw error;
    }
  }

  /**
   * Configure Distribution Bot parameters
   */
  static async configureDistributionBot(
    params: ConfigureDistributionBotParams
  ): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await api.put<ApiResponse<BotResponse>>(
        `${BACKEND_URL}/bots/${params.botId}/distribution-config`,
        params.config,
        getAuthHeaders()
      );
      if (!response.data) {
        throw new Error('No data returned from configure distribution bot API');
      }
      return response.data;
    } catch (error) {
      console.error('Error configuring distribution bot:', error);
      throw error;
    }
  }

  /**
   * Update pack enabled status
   */
  static async updatePackEnabled(
    params: UpdatePackEnabledParams
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch<ApiResponse<any>>(
        `${BACKEND_URL}/projects/${params.packId}/pack-enabled`,
        { enabled: params.enabled, chainName: params.chainName },
        getAuthHeaders()
      );
      if (!response.data) {
        throw new Error('No data returned from update pack enabled API');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating pack enabled status:', error);
      throw error;
    }
  }
}
