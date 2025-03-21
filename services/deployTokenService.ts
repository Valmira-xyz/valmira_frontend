import { ethers } from "ethers";
import axios from 'axios';
import type { PublicClient, WalletClient } from "viem";

import { 
  SocialLinks, 
  ContractResponse, 
  DeploymentJobResponse, 
  JobStatusResponse,
  VerificationParams,
  DeploymentParams
} from '@/types';
import { Config } from "@/lib/deploy-token/config";

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
    console.log(`Attempting operation... Remaining retries: ${retries}`);
    return await operation();
  } catch (error) {
    if (retries === 0) {
      console.error("Max retries reached. Throwing error:", error);
      throw error;
    }
    console.warn(`Operation failed. Retrying in ${RETRY_DELAY}ms... Retries left: ${retries - 1}`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryWithBackoff(operation, retries - 1);
  }
};

export const getContractWithSocialLinks = async (
  socialLinks: SocialLinks,
  templateNumber: number,
  tokenName: string
): Promise<ContractResponse> => {
  console.log("Fetching contract with social links:", { socialLinks, templateNumber, tokenName });
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await axios.post<ContractResponse>(
        `${CONTRACT_SERVER_URL}/getContractWithSocialLinks`,
        { ...socialLinks, templateNumber, tokenName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log("Contract retrieved successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching contract:", error);
      throw error;
    }
  });
};

export async function verifyContract(params: VerificationParams): Promise<DeploymentJobResponse> {
  console.log("Verifying contract with params:", params);
  await waitForRateLimit();
  
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
    console.log("Verification response received:", data);


    return data;
  } catch (error) {
    console.error("Error verifying contract:", error);
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  console.log("Fetching job status for jobId:", jobId);
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${CONTRACT_SERVER_URL}/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log("Job status received:", data);

      return data;
    } catch (error) {
      console.error("Error getting job status:", error);
      throw error;
    }
  });
}

export const contractDeployByCustomByteCode = async (byteCode: string, args: any[], signer: any, tokenTemplate: number) => {
  console.log("contractDeployByCustomByteCode  : ", args, signer, tokenTemplate);

  const TokenAbi = (Config.template2AbiMap as any)[tokenTemplate];

  const factory = new ethers.ContractFactory(
    TokenAbi.abi,
    byteCode,
    signer
  );

  const contract = await factory.deploy(...args);

  await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds

  return contract?.target;
};

export const getPairAddress = async (tokenAddress: string, signer: any) => {
  try {
    // Determine the ABI for the token contract
    const tokenAbi = [
      "function uniswapPair() view returns (address)"
    ]; // Modify this ABI if needed

    // Create an instance of the token contract
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    // Call the uniswapPair() function to get the pair address
    const pairAddress = await tokenContract.uniswapPair();

    return pairAddress;
  } catch (error) {
    console.error("Error fetching pair address:", error);
    return "0x0000000000000000000000000000000000000000"; // Return a zero address in case of failure
  }
};

export class TokenDeploymentService {
  private static instance: TokenDeploymentService;
  private provider: PublicClient;
  private walletClient: WalletClient;
  private signer: any;

  private constructor(provider: PublicClient, walletClient: WalletClient, signer: any) {
    this.provider = provider;
    this.walletClient = walletClient;
    this.signer = signer;
  }

  public static getInstance(provider: PublicClient, walletClient: WalletClient, signer: any): TokenDeploymentService {
    if (!TokenDeploymentService.instance) {
      TokenDeploymentService.instance = new TokenDeploymentService(provider, walletClient, signer);
    }
    return TokenDeploymentService.instance;
  }

  private validateParams(params: DeploymentParams): void {
    console.log("deployment params : ", params);
    if (!params.tokenName) {
      throw new Error("Token name is required");
    }
    if (!params.tokenSymbol) {
      throw new Error("Token symbol is required");
    }
    if (!params.tokenTotalSupply) {
      throw new Error("Total supply is required");
    }
    if (params.buyFee !== undefined && (params.buyFee < 0 || params.buyFee > 25)) {
      throw new Error("Marketing buy fee must be between 0 and 25");
    }
    if (params.sellFee !== undefined && (params.sellFee < 0 || params.sellFee > 25)) {
      throw new Error("Marketing sell fee must be between 0 and 25");
    }
  }

  private async getDeployArgs(params: DeploymentParams): Promise<any[]> {

    return [
      params.tokenName,
      params.tokenSymbol,
      params.tokenTotalSupply,
      params.buyFee || 3,
      params.sellFee || 3,
      params.maxHoldingLimit_ || 10,
      params.maxBuyLimit_ || 10,
      params.maxSellLimit_ || 10, 
      this.walletClient.account?.address || "0x0000000000000000000000000000000000000000"
    ];
  }

  public async deployToken(params: DeploymentParams): Promise<{ 
    contractAddress: string; 
    pairAddress: string,
    success: boolean,
    message: string }> {
    try {
      // Check wallet connection
      if (!this.walletClient.account) {
        throw new Error("Please connect your wallet before deploying");
      }

      // Validate parameters
      this.validateParams(params);

      // Get contract with social links
      const contractResponse = await getContractWithSocialLinks(
        params.socialLinks,
        params.templateNumber,
        params.tokenName
      );

      if (!contractResponse.success || !contractResponse.byteCode ) {
        throw new Error(contractResponse.message || "Failed to get contract");
      }

      console.log("contractResponse : ", contractResponse);
      
      // Get deployment arguments
      const deployArgs = await this.getDeployArgs(params);
      
      console.log('Deployment preparation:', {
        walletAddress: this.walletClient.account.address,
        templateNumber: params.templateNumber,
        argumentsCount: deployArgs.length
      });

      // Deploy contract
      const contractAddress = await contractDeployByCustomByteCode(
        contractResponse.byteCode,
        deployArgs,
        this.signer,
        params.templateNumber,
      );

      if (!contractAddress) {
        throw new Error("Failed to deploy contract");
      }

      // Fetch pair address with native currency at here
      const pairAddress = await getPairAddress(contractAddress as string, this.signer);
      console.log("pairAddress : ", pairAddress);

      // Notify backend for verification
      const verifyParams: VerificationParams = {
        deployedAddress: contractAddress as string,
        constructorArguments: deployArgs,
        customContractPath: contractResponse.path || "",
        templateNumber: params?.templateNumber || 0,
        tokenName: params.tokenName
        
      };
      console.log("auth token: ", localStorage.getItem("token"));
      console.log("verifyParams : ", verifyParams);
      const response = await verifyContract(verifyParams);

      return {
        contractAddress: contractAddress as string,
        pairAddress: pairAddress as string,
        success: response.success || false,
        message: response.message || "Failed to verify contract"
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      throw error;
    }
  }

} 

