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

      console.log('chainName : ', chainName);
      // For Algebra DEX networks (Somnia), initialize pool after deployment
      const isAlgebraDEX =
        chainName === 'SOMNIA_TESTNET' || chainName === 'SOMNIA_MAINNET';
      console.log('isAlgebraDEX : ', isAlgebraDEX);
      if (isAlgebraDEX) {
        try {
          console.log('Initializing Algebra pool for deployed contract...');

          // Wait longer for the contract to be fully deployed and propagated on-chain
          // This is important for Somnia testnet which may have slower block times
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const tokenContract = new ethers.Contract(
            contractAddress,
            [
              'function initializePool() external',
              'function canInitializePool() external view returns (bool canInit, string memory reason)',
              'function getFactoryConfig() external view returns (address pluginFactory, address vault, uint16 communityFee, bool hasPlugin, bool hasVault)',
              'function owner() external view returns (address)',
              'function poolInitialized() external view returns (bool)',
              'function isAlgebraDEX() external view returns (bool)',
              'function factoryAddress() external view returns (address)',
              'function wethAddress() external view returns (address)',
            ],
            this.signer
          );

          // Check factory configuration for debugging
          try {
            const factoryConfig = await tokenContract.getFactoryConfig();
            console.log('Factory configuration:', {
              pluginFactory: factoryConfig.pluginFactory,
              vaultFactory: factoryConfig.vault,
              communityFee: factoryConfig.communityFee.toString(),
              hasPlugin: factoryConfig.hasPlugin,
              hasVault: factoryConfig.hasVault,
            });

            if (factoryConfig.hasPlugin) {
              console.warn(
                '⚠️ Factory has plugin factory configured - plugin hooks may cause pool creation to fail'
              );
            }
            if (factoryConfig.hasVault) {
              console.warn(
                '⚠️ Factory has vault factory configured - vault creation may cause pool creation to fail'
              );
            }
          } catch (configError) {
            console.warn('Could not read factory configuration:', configError);
          }

          // Check if pool can be initialized
          try {
            const [canInit, reason] = await tokenContract.canInitializePool();
            if (!canInit) {
              throw new Error(`Cannot initialize pool: ${reason}`);
            }
            console.log('Pool initialization check passed');
          } catch (checkError: any) {
            console.error('Pool initialization check failed:', checkError);
            throw checkError;
          }

          // Check contract state before calling
          const [owner, alreadyInitialized, isAlgebra, factoryAddr, wethAddr] =
            await Promise.all([
              tokenContract.owner().catch(() => null),
              tokenContract.poolInitialized().catch(() => false),
              tokenContract.isAlgebraDEX().catch(() => false),
              tokenContract.factoryAddress().catch(() => null),
              tokenContract.wethAddress().catch(() => null),
            ]);

          console.log('Contract state check:', {
            owner,
            deployer: this.walletClient.account?.address,
            alreadyInitialized,
            isAlgebra,
            factoryAddr,
            wethAddr,
          });

          if (alreadyInitialized) {
            console.log('Pool already initialized, skipping...');
          } else {
            // Verify all required values are set
            if (
              !wethAddr ||
              wethAddr === '0x0000000000000000000000000000000000000000'
            ) {
              throw new Error('WETH address not set in contract');
            }
            if (
              !factoryAddr ||
              factoryAddr === '0x0000000000000000000000000000000000000000'
            ) {
              throw new Error('Factory address not set in contract');
            }
            if (!isAlgebra) {
              throw new Error('Contract is not configured for Algebra DEX');
            }

            // Check if pool already exists by querying the factory directly
            let existingPoolAddress = null;
            try {
              const factoryAbi = [
                'function poolByPair(address, address) external view returns (address)',
              ];
              const factoryContract = new ethers.Contract(
                factoryAddr,
                factoryAbi,
                this.signer
              );

              // Check both orders (factory handles token ordering internally)
              const [pool1, pool2] = await Promise.all([
                factoryContract
                  .poolByPair(contractAddress, wethAddr)
                  .catch(() => '0x0000000000000000000000000000000000000000'),
                factoryContract
                  .poolByPair(wethAddr, contractAddress)
                  .catch(() => '0x0000000000000000000000000000000000000000'),
              ]);

              console.log('pool1 : ', pool1);
              console.log('pool2 : ', pool2);

              existingPoolAddress =
                pool1 !== '0x0000000000000000000000000000000000000000'
                  ? pool1
                  : pool2;

              if (
                existingPoolAddress !==
                '0x0000000000000000000000000000000000000000'
              ) {
                console.log(
                  'Pool already exists in factory:',
                  existingPoolAddress
                );
              } else {
                console.log('No existing pool found, will create new one');
              }
            } catch (factoryError) {
              console.warn(
                'Could not check factory for existing pool:',
                factoryError
              );
            }

            // Call initializePool with increased gas limit
            console.log('Calling initializePool...');
            try {
              // Estimate gas first
              const gasEstimate = await tokenContract.initializePool
                .estimateGas()
                .catch((err: any) => {
                  console.warn('Gas estimation failed:', err);
                  return null;
                });

              const gasLimit = gasEstimate
                ? (gasEstimate * BigInt(150)) / BigInt(100)
                : BigInt(5000000); // 50% buffer or 5M default
              console.log('Using gas limit:', gasLimit.toString());

              const initTx = await tokenContract.initializePool({
                gasLimit: gasLimit,
              });
              console.log('Pool initialization transaction:', initTx.hash);

              // Wait for transaction confirmation
              const receipt = await initTx.wait();

              // Check if transaction succeeded
              if (receipt?.status === 0) {
                throw new Error('Pool initialization transaction failed');
              }

              console.log(
                'Pool initialized successfully. Gas used:',
                receipt?.gasUsed?.toString()
              );

              // Verify the pool was actually initialized
              const poolInitialized = await tokenContract.poolInitialized();
              const pairAddress = await tokenContract.uniswapPair();

              if (!poolInitialized) {
                throw new Error(
                  'Pool initialization transaction succeeded but poolInitialized is still false'
                );
              }

              if (
                !pairAddress ||
                pairAddress === '0x0000000000000000000000000000000000000000'
              ) {
                throw new Error(
                  'Pool initialization transaction succeeded but pair address is zero'
                );
              }

              console.log('Pool verified - Pair address:', pairAddress);
            } catch (txError: any) {
              console.error('Transaction failed:', txError);
              if (txError?.data) {
                console.error('Error data:', txError.data);
              }
              if (txError?.reason) {
                console.error('Error reason:', txError.reason);
              }
              throw txError;
            }
          }
        } catch (initError: any) {
          console.error('Failed to initialize pool:', initError);
          // Log more details about the error
          if (initError?.data) {
            console.error('Error data:', initError.data);
          }
          if (initError?.reason) {
            console.error('Error reason:', initError.reason);
          }
          // Log a user-friendly message
          console.warn(
            '⚠️ Pool initialization failed. The contract has been deployed successfully, ' +
              'but the Algebra pool could not be created automatically. ' +
              'You can initialize the pool manually by calling initializePool() on the contract, ' +
              'or the pool may be created automatically when the first liquidity is added.'
          );
          // Don't throw - allow deployment to succeed even if pool init fails
          // The pool can be initialized manually later
        }
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

      // Build success message
      let successMessage = response.message || 'Contract deployed successfully';
      if (isAlgebraDEX && !pairAddress) {
        successMessage +=
          ' Note: Algebra pool initialization failed. ' +
          'You can initialize the pool manually by calling initializePool() on the contract.';
      }

      return {
        contractAddress: contractAddress as string,
        pairAddress: pairAddress,
        success: true, // Always true if we got here (contract is deployed)
        message: successMessage,
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  }
}
