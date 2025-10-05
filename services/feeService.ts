// valmira-frontend/src/services/feeService.ts

import { authService } from './authService';
import { config } from './config';
import axios from 'axios';

import { staticBotCalculatorMetadata } from '@/lib/mock-data'; // Import the static metadata here
import { BotConfig } from '@/types/fee-calculator';

const BACKEND_URL = config.apiUrl;

// --- Existing Type Definitions (unchanged) ---
export interface FeeConfig {
  projectId: string;
  projectSetupFee: number;
  dailyBotFee: number;
  liquidationBotProfitPercentage: number;
  volumeBotPercentage: number;
  bundleSnipePercentage: number;
  distributionBotPercentage: number;
  bundleSnipeExecutionFee?: number;
  distributionWalletFee?: number;
  volumeTiers: {
    minVolume: number;
    maxVolume?: number;
    percentage: number;
  }[];
  dailyFeeCap?: number;
  monthlyFeeCap?: number;
  liquidationProfitMinimum?: number;
  isActive: boolean;
  hasCustomFees: boolean;
  customizedFields: {
    [key: string]: boolean;
  };
}

export interface GlobalFeeConfig extends Omit<FeeConfig, 'projectId'> {
  id: string;
}

export interface ProjectFeeSummary {
  projectId: string;
  tokenName: string;
  tokenAddress: string;
  feeWalletAddress: string;
  chainName: string;
  hasCustomFees: boolean;
  customizedFields: {
    [key: string]: boolean;
  };
  isActive: boolean;
}

export interface FeeHistory {
  date: Date;
  fixedFees: number;
  volumeFees: number;
  liquidationFees: number;
  bundleSnipeFees: number;
  distributionFees: number;
  totalFees: number;
}

export interface FeeCollectionResult {
  projectId: string;
  walletAddress: string;
  taskType: 'token' | 'wrappedNative' | 'native';
  success: boolean;
  hash?: string;
  error?: string;
  amount: number;
  usdValue: number;
}

export interface FeeCollectionResponse {
  summary: {
    totalWallets: number;
    successfulCollections: number;
    failedCollections: number;
    totalUsdCollected: number;
    chainName: string;
    targetAdminWallet: string;
  };
  resultsByProject: Array<{
    projectId: string;
    collections: FeeCollectionResult[];
    totalUsdValue: number;
    successCount: number;
    failCount: number;
  }>;
  detailedResults: FeeCollectionResult[];
}

// Add new interfaces for async job handling
export interface FeeCollectionJobResponse {
  status: 'accepted';
  message: string;
  data: {
    jobId: string;
    expectedDuration: string;
    projectCount: number;
    chainName: string;
    targetAdminWallet: string;
    statusEndpoint: string;
  };
}

export interface FeeCollectionJobStatus {
  status: 'success';
  data: {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime: number;
    duration: number;
    projectIds: string[];
    results?: FeeCollectionResponse;
    error?: string;
  };
}

class FeeService {
  private getAuthHeader() {
    return authService.getAuthHeader();
  }

  // --- Existing Fee Management Methods (unchanged) ---
  async getGlobalFees(): Promise<GlobalFeeConfig> {
    try {
      const response = await axios.get(`${BACKEND_URL}/fees/global`, {
        headers: this.getAuthHeader(),
      });
      return response.data as GlobalFeeConfig;
    } catch (error) {
      console.error('Failed to get global fees:', error);
      throw error;
    }
  }

  // ... (all other existing methods like updateGlobalFees, getAllProjectFees, etc. remain here) ...
  // (Removed for brevity, but they should be in your file)

  async updateGlobalFees(
    data: Partial<GlobalFeeConfig>
  ): Promise<GlobalFeeConfig> {
    try {
      const response = await axios.put(`${BACKEND_URL}/fees/global`, data, {
        headers: this.getAuthHeader(),
      });
      return response.data as GlobalFeeConfig;
    } catch (error) {
      console.error('Failed to update global fees:', error);
      throw error;
    }
  }

  async getAllProjectFees(
    pageIndex = 0,
    maxPageCount = 20
  ): Promise<{
    data: ProjectFeeSummary[];
    pagination: {
      pageIndex: number;
      maxPageCount: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const response = await axios.get(`${BACKEND_URL}/fees/projects`, {
        headers: this.getAuthHeader(),
        params: {
          pageIndex,
          maxPageCount,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get project fees:', error);
      throw error;
    }
  }

  async getFeeConfig(projectId: string): Promise<FeeConfig> {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/fees/projects/${projectId}`,
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeConfig;
    } catch (error) {
      console.error('Failed to get fee config:', error);
      throw error;
    }
  }

  async createFeeConfig(data: Partial<FeeConfig>): Promise<FeeConfig> {
    try {
      const response = await axios.post(`${BACKEND_URL}/fees/projects`, data, {
        headers: this.getAuthHeader(),
      });
      return response.data as FeeConfig;
    } catch (error) {
      console.error('Failed to create fee config:', error);
      throw error;
    }
  }

  async updateFeeConfig(
    projectId: string,
    data: Partial<FeeConfig>
  ): Promise<FeeConfig> {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/fees/projects/${projectId}`,
        data,
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeConfig;
    } catch (error) {
      console.error('Failed to update fee config:', error);
      throw error;
    }
  }

  async resetProjectFees(projectId: string): Promise<FeeConfig> {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/fees/projects/${projectId}/reset`,
        {},
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeConfig;
    } catch (error) {
      console.error('Failed to reset project fees:', error);
      throw error;
    }
  }

  async setAllFeesToZero(projectId: string): Promise<FeeConfig> {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/fees/projects/${projectId}/zero`,
        {},
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeConfig;
    } catch (error) {
      console.error('Failed to set fees to zero:', error);
      throw error;
    }
  }

  async getFeeHistory(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FeeHistory[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await axios.get(
        `${BACKEND_URL}/fees/projects/${projectId}/history`,
        {
          headers: this.getAuthHeader(),
          params,
        }
      );
      return response.data as FeeHistory[];
    } catch (error) {
      console.error('Failed to get fee history:', error);
      throw error;
    }
  }

  // --- NEW: Method to get Calculator Bot Configurations with Dynamic Pricing (using static UI metadata) ---

  /**
   * Fetches global fee data from the backend and merges it into the static UI metadata
   * for the fee calculator, providing a complete BotConfig array with live pricing.
   * This centralizes the data preparation for the calculator.
   *
   * @returns A promise resolving to a BotConfig[] array with dynamic fee values and static UI definitions.
   */
  async getBotConfigs(): Promise<BotConfig[]> {
    try {
      const globalFees = await this.getGlobalFees(); // Fetch dynamic global fees

      // Create a deep copy of the static metadata to avoid mutating the original
      const dynamicBotConfigs: BotConfig[] = JSON.parse(
        JSON.stringify(staticBotCalculatorMetadata)
      );

      dynamicBotConfigs.forEach((bot) => {
        // Apply global daily fee to each bot
        bot.dailyFee = globalFees.dailyBotFee;

        // Apply global performance fee values
        bot.performanceFeeOptions.forEach((option) => {
          switch (bot.id) {
            case 'liquidation':
              if (
                option.type === 'profit' &&
                globalFees.liquidationBotProfitPercentage !== undefined
              ) {
                option.value = globalFees.liquidationBotProfitPercentage;
              }
              break;
            case 'volume':
              if (
                option.type === 'volume' &&
                globalFees.volumeBotPercentage !== undefined
              ) {
                option.value = globalFees.volumeBotPercentage;
              }
              break;
            case 'bundle-snipe':
              // Assuming first 'tokens' option gets bundleSnipePercentage
              if (
                option.type === 'tokens' &&
                globalFees.bundleSnipePercentage !== undefined
              ) {
                // To avoid overwriting all token options if backend only gives one,
                // apply only if the static option's value matches a known default, or based on index.
                // For simplicity, applying to the first matching 'tokens' and 'profit' option.
                // You might need more precise logic if you have multiple tiers on backend.
                if (option.value === 2) {
                  // Assuming 2% token option in static data is the primary one
                  option.value = globalFees.bundleSnipePercentage;
                }
              } else if (
                option.type === 'profit' &&
                globalFees.liquidationBotProfitPercentage !== undefined
              ) {
                if (option.value === 5) {
                  // Assuming 5% profit option in static data is the primary one
                  option.value = globalFees.liquidationBotProfitPercentage;
                }
              }
              // If there's a specific 'bundleSnipeExecutionFee' for flat, apply here
              // if (option.type === 'flat' && globalFees.bundleSnipeExecutionFee !== undefined) {
              //   option.value = globalFees.bundleSnipeExecutionFee;
              // }
              break;
            case 'distribution':
              if (
                option.type === 'tokens' &&
                globalFees.distributionBotPercentage !== undefined
              ) {
                if (option.value === 0.5) {
                  // Assuming 0.5% token option in static data is the primary one
                  option.value = globalFees.distributionBotPercentage;
                }
              } else if (
                option.type === 'flat' &&
                globalFees.distributionWalletFee !== undefined
              ) {
                option.value = globalFees.distributionWalletFee;
              }
              break;
          }
        });

        // Also update the 'options' array within inputFields if they are derived from backend fees
        // This is primarily for the 'volume' bot's 'feeRate' select and 'bundle-snipe' / 'distribution' feeStructure
        if (bot.id === 'volume') {
          const feeRateField = bot.inputFields.find((f) => f.id === 'feeRate');
          if (
            feeRateField &&
            feeRateField.type === 'select' &&
            feeRateField.options
          ) {
            // If backend provides specific volume tiers that should populate these options:
            // For now, let's just make sure the existing options reflect backend global percentages
            feeRateField.options[0].value =
              globalFees.volumeBotPercentage ?? 0.05; // Standard option
            // If there's a second volume tier in backend, you'd map it to options[1].value
            // For simplicity, assuming backend.volumeBotPercentage is for the 'Standard' option (0.05%)
          }
        }
        if (bot.id === 'bundle-snipe') {
          const feeStructureField = bot.inputFields.find(
            (f) => f.id === 'feeStructure'
          );
          if (
            feeStructureField &&
            feeStructureField.type === 'select' &&
            feeStructureField.options
          ) {
            // Assuming static options map to backend percentages for tokens/profit
            feeStructureField.options[0].value =
              globalFees.bundleSnipePercentage ?? 2; // For '2% of tokens'
            feeStructureField.options[2].value =
              globalFees.liquidationBotProfitPercentage ?? 5; // For '5% of profit'
            // You'd need more complex logic if backend provided different tiers or if only one value is from backend.
            // This part needs careful validation against your backend's actual fee structure and how it exposes multiple tiers.
          }
        }
        if (bot.id === 'distribution') {
          const feeStructureField = bot.inputFields.find(
            (f) => f.id === 'feeStructure'
          );
          if (
            feeStructureField &&
            feeStructureField.type === 'select' &&
            feeStructureField.options
          ) {
            feeStructureField.options[0].value =
              globalFees.distributionBotPercentage ?? 0.5; // For '0.5% of tokens'
            feeStructureField.options[2].value =
              globalFees.distributionWalletFee ?? 0.5; // For '$0.50 per wallet'
          }
        }
      });

      return dynamicBotConfigs;
    } catch (error) {
      console.error(
        'Failed to get calculator configurations with dynamic pricing:',
        error
      );
      // Re-throw the error so TanStack Query can handle it
      throw error;
    }
  }

  // Fee Collection Methods
  async collectProjectFees(
    targetAdminWallet: string,
    projectIds: string[],
    chainName: string
  ): Promise<FeeCollectionResponse> {
    try {
      // Start the collection job
      const jobResponse = await axios.post(
        `${BACKEND_URL}/fees/collect`,
        {
          targetAdminWallet,
          projectIds,
          chainName,
        },
        {
          headers: this.getAuthHeader(),
        }
      );

      const jobData = jobResponse.data as FeeCollectionJobResponse;
      const jobId = jobData.data.jobId;

      // Poll for completion
      return await this.pollForJobCompletion(jobId);
    } catch (error) {
      console.error('Failed to collect project fees:', error);
      throw error;
    }
  }

  /**
   * Start fee collection job and return job ID immediately
   */
  async startFeeCollection(
    targetAdminWallet: string,
    projectIds: string[],
    chainName: string
  ): Promise<FeeCollectionJobResponse> {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/fees/collect`,
        {
          targetAdminWallet,
          projectIds,
          chainName,
        },
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeCollectionJobResponse;
    } catch (error) {
      console.error('Failed to start fee collection:', error);
      throw error;
    }
  }

  /**
   * Check fee collection job status
   */
  async getFeeCollectionJobStatus(
    jobId: string
  ): Promise<FeeCollectionJobStatus> {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/fees/collect/${jobId}/status`,
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data as FeeCollectionJobStatus;
    } catch (error) {
      console.error('Failed to get fee collection job status:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion with timeout
   */
  private async pollForJobCompletion(
    jobId: string,
    maxWaitTime: number = 20 * 60 * 1000, // 20 minutes
    pollInterval: number = 3000 // 3 seconds
  ): Promise<FeeCollectionResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await this.getFeeCollectionJobStatus(jobId);
        const status = statusResponse.data.status;

        if (status === 'completed') {
          if (statusResponse.data.results) {
            return statusResponse.data.results;
          } else {
            throw new Error('Job completed but no results available');
          }
        } else if (status === 'failed') {
          throw new Error(statusResponse.data.error || 'Fee collection failed');
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for job completion:', error);
        throw error;
      }
    }

    throw new Error('Fee collection timed out');
  }

  async getFeeCollectionHistory(
    startDate?: Date,
    endDate?: Date,
    chainName?: string
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (chainName) params.append('chainName', chainName);

      const response = await axios.get(
        `${BACKEND_URL}/fees/collection-history`,
        {
          headers: this.getAuthHeader(),
          params,
        }
      );
      return response.data.data.collections;
    } catch (error) {
      console.error('Failed to get fee collection history:', error);
      throw error;
    }
  }
}

export const feeService = new FeeService();
