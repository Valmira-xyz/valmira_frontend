import axios from 'axios';
import { 
  SocialLinks, 
  ContractResponse, 
  DeploymentJobResponse, 
  JobStatusResponse,
  ProjectData,
  ProjectResponse,
  DeploymentParams
} from './types';

const CONTRACT_SERVER_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/contracts`;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second
let lastRequestTime = 0;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function for rate limiting
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
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
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryWithBackoff(operation, retries - 1);
  }
};

interface TokenResponse {
  success: boolean;
  message: string;
  token: {
    _id: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    websiteLink?: string;
    telegramLink?: string;
    twitterLink?: string;
    discordLink?: string;
    buyFee?: number;
    sellFee?: number;
    maxHoldingLimit_: number;
    maxBuyLimit_: number;
    maxSellLimit_: number;
    templateNumber: number;
    owner: string;
  };
}

export const getContractWithSocialLinks = async (
  socialLinks: SocialLinks,
  templateNumber: number,
  tokenName: string
): Promise<ContractResponse> => {
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await axios.post<ContractResponse>(
        `${CONTRACT_SERVER_URL}/getContractWithSocialLinks`,
        {
          ...socialLinks,
          templateNumber,
          tokenName
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        throw new Error(axiosError.response?.data?.message || 'Failed to get contract');
      }
      throw new Error('Failed to get contract');
    }
  });
};

export async function verifyContract(params: DeploymentParams): Promise<DeploymentJobResponse> {
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${CONTRACT_SERVER_URL}/verify-contract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify contract");
      }

      return data;
    } catch (error) {
      console.error("Error verifying contract:", error);
      throw error;
    }
  });
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${CONTRACT_SERVER_URL}/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get job status");
      }

      return data;
    } catch (error) {
      console.error("Error getting job status:", error);
      throw error;
    }
  });
}

export async function createProject(projectData: ProjectData): Promise<ProjectResponse> {
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/project/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle duplicate key error (error code 11000)
        if (data.code === 11000) {
          // Get existing token
          const tokenResponse = await fetch(`${BACKEND_URL}/token/${projectData.tokenAddress}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          const tokenData = await tokenResponse.json();

          if (tokenResponse.ok && tokenData.token) {
            // Retry project creation with existing token
            return createProject({
              ...projectData,
              tokenData: {
                ...projectData.tokenData,
                ...tokenData.token,
              },
            });
          }
        }
        throw new Error(data.message || "Failed to create project");
      }

      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  });
} 