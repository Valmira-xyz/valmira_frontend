import axios from 'axios';
import { ethers } from 'ethers';
import type { PublicClient, WalletClient } from 'viem';

import { Config } from '@/lib/deploy-token/config';
import {
  ContractResponse,
  DeploymentJobResponse,
  DeploymentParams,
  JobStatusResponse,
  SocialLinks,
  VerificationParams,
} from '@/types';

const CONTRACT_SERVER_URL = `${process.env.NEXT_PUBLIC_CONTRACT_SERVER_URL}/contracts`;
// const CONTRACT_SERVER_URL = `https://valmira.blockvalidtest.com/api/contracts`;

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
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
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
      console.error('Max retries reached. Throwing error:', error);
      throw error;
    }
    console.warn(
      `Operation failed. Retrying in ${RETRY_DELAY}ms... Retries left: ${retries - 1}`
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    return retryWithBackoff(operation, retries - 1);
  }
};

export const getContractWithSocialLinks = async (
  socialLinks: SocialLinks,
  templateNumber: number,
  tokenName: string
): Promise<ContractResponse> => {
  console.log('Fetching contract with social links:', {
    socialLinks,
    templateNumber,
    tokenName,
  });
  await waitForRateLimit();

  return retryWithBackoff(async () => {
    try {
      const response = await axios.post<ContractResponse>(
        `${CONTRACT_SERVER_URL}/getContractWithSocialLinks`,
        { ...socialLinks, templateNumber, tokenName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Contract retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  });
};

export async function verifyContract(
  params: VerificationParams,
  chainName?: string
): Promise<DeploymentJobResponse> {
  console.log('Verifying contract with params:', { ...params, chainName });
  await waitForRateLimit();

  try {
    const response = await fetch(`${CONTRACT_SERVER_URL}/verify-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ ...params, chainName }),
    });

    const data = await response.json();
    console.log('Verification response received:', data);

    return data;
  } catch (error) {
    console.error('Error verifying contract:', error);
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  console.log('Fetching job status for jobId:', jobId);
  await waitForRateLimit();

  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${CONTRACT_SERVER_URL}/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      console.log('Job status received:', data);

      return data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  });
}

export const contractDeployByCustomByteCode = async (
  byteCode: string,
  args: any[],
  signer: any,
  tokenTemplate: number
) => {
  console.log(
    'contractDeployByCustomByteCode  : ',
    args,
    signer,
    tokenTemplate
  );

  const TokenAbi = (Config.template2AbiMap as any)[tokenTemplate];

  const factory = new ethers.ContractFactory(TokenAbi.abi, byteCode, signer);

  // Get gas price directly using eth_gasPrice to avoid EIP-1559 issues
  let gasPrice;
  try {
    // Use eth_gasPrice directly for legacy networks
    const gasPriceHex = await signer.provider.send('eth_gasPrice', []);
    gasPrice = BigInt(gasPriceHex);
    console.log('Retrieved gas price from network:', gasPrice.toString());
  } catch (error) {
    console.warn(
      'Failed to get gas price via eth_gasPrice, using default:',
      error
    );
    gasPrice = ethers.parseUnits('10', 'gwei');
    console.log('Using default gas price:', gasPrice.toString());
  }

  // Encode constructor arguments
  const deployData = factory.interface.encodeDeploy(args);
  const fullByteCode = ethers.concat([byteCode, deployData]);

  console.log('Preparing manual transaction deployment...');

  const fromAddress = await signer.getAddress();

  // Estimate gas for deployment
  let estimatedGas;
  try {
    console.log('Estimating gas for deployment...');
    const gasEstimate = await signer.provider.estimateGas({
      from: fromAddress,
      data: ethers.hexlify(fullByteCode),
    });
    // Add 20% buffer to gas estimate for safety
    estimatedGas = (gasEstimate * BigInt(120)) / BigInt(100);
    console.log(
      'Estimated gas:',
      gasEstimate.toString(),
      '→ With buffer:',
      estimatedGas.toString()
    );
  } catch (error) {
    console.warn('Gas estimation failed, using fallback:', error);
    // Fallback to 8M if estimation fails
    estimatedGas = BigInt(8000000);
  }

  // Manually construct transaction params - send directly via MetaMask RPC to bypass ethers.js
  const txParams = {
    from: fromAddress,
    data: ethers.hexlify(fullByteCode),
    gas: ethers.toBeHex(estimatedGas), // Use estimated gas with buffer
    gasPrice: ethers.toBeHex(gasPrice), // Convert to hex
  };

  console.log(
    'Sending deployment transaction directly via eth_sendTransaction...'
  );
  console.log('Transaction params:', {
    from: txParams.from,
    dataLength: txParams.data.length,
    gas: txParams.gas,
    gasPrice: txParams.gasPrice,
  });

  // Access the raw Ethereum provider (window.ethereum) to completely bypass ethers.js
  const ethereum = typeof window !== 'undefined' && (window as any).ethereum;

  if (!ethereum || typeof ethereum.request !== 'function') {
    throw new Error('MetaMask or Ethereum provider not found');
  }

  console.log('Using raw Ethereum provider to send transaction...');

  // Send transaction directly to MetaMask, bypassing all ethers.js processing
  const txHash = (await (ethereum.request as any)({
    method: 'eth_sendTransaction',
    params: [txParams],
  })) as string;

  console.log('Contract deployment transaction sent:', txHash);

  // Wait for transaction to be mined using raw provider
  let receipt: any = null;
  let attempts = 0;
  const maxAttempts = 60; // Wait up to 60 seconds

  while (!receipt && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      receipt = await (ethereum.request as any)({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });
      if (receipt) {
        console.log('Contract deployed at:', receipt.contractAddress);
        break;
      }
    } catch {
      // Receipt not available yet, continue waiting
    }
    attempts++;
  }

  if (!receipt) {
    throw new Error('Transaction receipt not received after 60 seconds');
  }

  if (!receipt.contractAddress) {
    throw new Error(
      'Contract deployment failed - no contract address in receipt'
    );
  }

  return receipt.contractAddress;
};

export const getPairAddress = async (tokenAddress: string, signer: any) => {
  try {
    // Determine the ABI for the token contract
    const tokenAbi = ['function uniswapPair() view returns (address)']; // Modify this ABI if needed

    // Create an instance of the token contract
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    // Retry mechanism - give the contract time to initialize after deployment
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Wait a bit before each attempt (except the first one)
        if (attempt > 0) {
          console.log(
            `Retrying to fetch pair address (attempt ${attempt + 1}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }

        // Call the uniswapPair() function to get the pair address
        const pairAddress = await tokenContract.uniswapPair();

        console.log(
          `Pair address fetched (attempt ${attempt + 1}):`,
          pairAddress
        );

        // Return the address, even if it's zero address
        // The pair might be created later or might not exist for this token type
        return pairAddress || '0x0000000000000000000000000000000000000000';
      } catch (error) {
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries} to fetch pair address failed:`,
          error
        );

        // If this is the last attempt, return zero address
        if (attempt === maxRetries - 1) {
          console.warn('All attempts failed, returning zero address');
          return '0x0000000000000000000000000000000000000000';
        }
      }
    }

    // Fallback (should never reach here due to return in loop)
    return '0x0000000000000000000000000000000000000000';
  } catch (error) {
    console.error('Unexpected error in getPairAddress:', error);
    return '0x0000000000000000000000000000000000000000'; // Return a zero address in case of failure
  }
};

export class TokenDeploymentService {
  private static instance: TokenDeploymentService;
  private provider: PublicClient;
  private walletClient: WalletClient;
  private signer: any;

  private constructor(
    provider: PublicClient,
    walletClient: WalletClient,
    signer: any
  ) {
    this.provider = provider;
    this.walletClient = walletClient;
    this.signer = signer;
  }

  public static getInstance(
    provider: PublicClient,
    walletClient: WalletClient,
    signer: any
  ): TokenDeploymentService {
    if (!TokenDeploymentService.instance) {
      TokenDeploymentService.instance = new TokenDeploymentService(
        provider,
        walletClient,
        signer
      );
    }
    return TokenDeploymentService.instance;
  }

  private validateParams(params: DeploymentParams): void {
    console.log('deployment params : ', params);
    if (!params.tokenName) {
      throw new Error('Token name is required');
    }
    if (!params.tokenSymbol) {
      throw new Error('Token symbol is required');
    }
    if (!params.tokenTotalSupply) {
      throw new Error('Total supply is required');
    }
    if (
      params.buyFee !== undefined &&
      (params.buyFee < 0 || params.buyFee > 25)
    ) {
      throw new Error('Marketing buy fee must be between 0 and 25');
    }
    if (
      params.sellFee !== undefined &&
      (params.sellFee < 0 || params.sellFee > 25)
    ) {
      throw new Error('Marketing sell fee must be between 0 and 25');
    }
  }

  private async getDeployArgs(params: DeploymentParams): Promise<any[]> {
    return [
      params.tokenName,
      params.tokenSymbol,
      params.tokenTotalSupply,
      params.buyFee || 3,
      params.sellFee || 3,
      params.maxHoldingLimit_ || 100000000,
      params.maxBuyLimit_ || 100000000,
      params.maxSellLimit_ || 100000000,
      this.walletClient.account?.address ||
        '0x0000000000000000000000000000000000000000',
    ];
  }

  public async deployToken(
    params: DeploymentParams,
    chainName?: string
  ): Promise<{
    contractAddress: string;
    pairAddress: string;
    success: boolean;
    message: string;
  }> {
    try {
      // Check wallet connection
      if (!this.walletClient.account) {
        throw new Error('Please connect your wallet before deploying');
      }

      // Validate parameters
      this.validateParams(params);

      // Get contract with social links
      const contractResponse = await getContractWithSocialLinks(
        params.socialLinks,
        params.templateNumber,
        params.tokenName
      );

      if (!contractResponse.success || !contractResponse.byteCode) {
        throw new Error(contractResponse.message || 'Failed to get contract');
      }

      console.log('contractResponse : ', contractResponse);

      // Get deployment arguments
      const deployArgs = await this.getDeployArgs(params);

      console.log('Deployment preparation:', {
        walletAddress: this.walletClient.account.address,
        templateNumber: params.templateNumber,
        argumentsCount: deployArgs.length,
      });

      // Deploy contract
      const contractAddress = await contractDeployByCustomByteCode(
        contractResponse.byteCode,
        deployArgs,
        this.signer,
        params.templateNumber
      );

      if (!contractAddress) {
        throw new Error('Failed to deploy contract');
      }

      // Fetch pair address with native currency at here
      const fetchedPairAddress = await getPairAddress(
        contractAddress as string,
        this.signer
      );
      console.log('pairAddress : ', fetchedPairAddress);

      // Convert zero address to empty string for backend compatibility
      const pairAddress =
        fetchedPairAddress &&
        fetchedPairAddress !== '0x0000000000000000000000000000000000000000'
          ? fetchedPairAddress
          : '';

      // Notify backend for verification
      const verifyParams: VerificationParams = {
        deployedAddress: contractAddress as string,
        constructorArguments: deployArgs,
        customContractPath: contractResponse.path || '',
        templateNumber: params?.templateNumber || 0,
        tokenName: params.tokenName,
      };
      console.log('auth token: ', localStorage.getItem('token'));
      console.log('verifyParams : ', verifyParams, 'chainName: ', chainName);

      let response;
      try {
        response = await verifyContract(verifyParams, chainName);
      } catch (verifyError) {
        console.error(
          'Verification failed, but continuing with deployment:',
          verifyError
        );
        // If verification fails, still return success since the contract is deployed
        response = {
          success: true, // Contract is deployed, just verification failed
          message:
            'Contract deployed successfully, but verification failed. You can verify it manually later.',
          jobId: null,
        };
      }

      return {
        contractAddress: contractAddress as string,
        pairAddress: pairAddress,
        success: true, // Always true if we got here (contract is deployed)
        message: response.message || 'Contract deployed successfully',
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  }
}
