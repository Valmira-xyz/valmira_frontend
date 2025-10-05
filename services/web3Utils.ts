import Big from 'big.js';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';

import MemeTemplateJson from '@/lib/deploy-token/abi/MemeTemplate.json';
import { PoolInfo, WalletBalance } from '@/types';

import { store } from '../store/store';
Big.RM = Big.roundDown;

const ERC20_ABI = MemeTemplateJson.abi;

// PancakeSwap V2 Router ABI (minimal)
const ROUTER_ABI = [
  'function factory() external pure returns (address)',
  'function WETH() external view returns (address)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] amounts)',
  'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
  'function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn)',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
];

// PancakeSwap V2 Factory ABI (minimal)
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
];

// PancakeSwap V2 Pair ABI (minimal)
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function balanceOf(address owner) external view returns (uint)',
  'function totalSupply() external view returns (uint)',
  'function allowance(address owner, address spender) external view returns (uint)',
  'function approve(address spender, uint value) external returns (bool)',
  'function transfer(address to, uint value) external returns (bool)',
];

// Chain-specific configuration
interface ChainConfig {
  rpcUrl: string;
  nativeCurrency: string;
  factoryAddress: string;
  routerAddress: string;
  disperseAddress: string;
  stablecoins: string[];
  wrappedNativeCurrency: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  BSC_MAINNET: {
    rpcUrl:
      process.env.NEXT_PUBLIC_BSC_RPC_URL ||
      'https://bsc-dataseed.binance.org/',
    nativeCurrency: 'BNB',
    factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // PancakeSwap V2
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap V2
    disperseAddress: '0xD152f549545093347A162Dce210e7293f1452150', // To be implemented for BSC
    stablecoins: [
      '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
      '0x55d398326f99059fF775485246999027B3197955', // USDT
      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    ],
    wrappedNativeCurrency: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  },
  ETH_MAINNET: {
    rpcUrl:
      process.env.NEXT_PUBLIC_ETH_RPC_URL ||
      'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    nativeCurrency: 'ETH',
    factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Uniswap V2
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
    disperseAddress: '0xD152f549545093347A162Dce210e7293f1452150', // To be implemented for Ethereum
    stablecoins: [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ],
    wrappedNativeCurrency: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  },
  SOL_MAINNET: {
    rpcUrl: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
    nativeCurrency: 'SOL',
    factoryAddress: '', // Not applicable for Solana
    routerAddress: '', // Not applicable for Solana
    disperseAddress: '', // Not applicable for Solana
    stablecoins: [], // To be implemented for Solana
    wrappedNativeCurrency: '', // To be implemented for Solana
  },
  SOMNIA_TESTNET: {
    rpcUrl:
      process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ||
      'https://dream-rpc.somnia.network/',
    nativeCurrency: 'STT',
    factoryAddress: '', // To be deployed on Somnia Testnet
    routerAddress: '', // To be deployed on Somnia Testnet
    disperseAddress: '', // To be deployed on Somnia Testnet
    stablecoins: [], // To be configured for Somnia Testnet
    wrappedNativeCurrency: '', // WSTT - To be deployed on Somnia Testnet
  },
};

function getProvider(chainName: string): ethers.JsonRpcProvider {
  const rpcUrl =
    chainName === 'BSC_MAINNET'
      ? process.env.NEXT_PUBLIC_BSC_RPC_URL
      : chainName === 'ETH_MAINNET'
        ? process.env.NEXT_PUBLIC_ETH_RPC_URL
        : chainName === 'SOMNIA_TESTNET'
          ? process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ||
            'https://dream-rpc.somnia.network/'
          : '';

  return new ethers.JsonRpcProvider(rpcUrl);
}

export function formatValue(value: number | string, decimals = 2): string {
  const decimalValue = new Decimal(value);
  return decimalValue.toDecimalPlaces(decimals, Decimal.ROUND_DOWN).toString();
}

/**
 * Fetches the native currency balance for a given wallet address
 * @param provider - The ethers provider
 * @param address - The wallet address to check
 * @returns The native currency balance in ethers (as a number)
 */
export const getNativeBalance = async (
  address: string,
  chainName: string = 'BSC_MAINNET'
): Promise<number> => {
  const nativeCurrency =
    chainName === 'BSC_MAINNET'
      ? 'BNB'
      : chainName === 'ETH_MAINNET'
        ? 'ETH'
        : chainName === 'SOMNIA_TESTNET'
          ? 'STT'
          : 'SOL';

  try {
    console.log('[getNativeBalance] address, chainName', address, chainName);
    const provider = getProvider(chainName);
    const balanceWei = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balanceWei));
  } catch (error) {
    console.error(`Error fetching ${nativeCurrency} balance:`, error);
    throw new Error(`Failed to fetch native currency balance: ${error}`);
  }
};

/**
 * Transfers native currency from the signer's wallet to the target address
 * @param signer - The ethers signer
 * @param toAddress - The recipient wallet address
 * @param amount - The amount of native currency to transfer in ether
 * @returns The transaction receipt
 */
export const transferNativeCurrency = async (
  signer: ethers.Signer,
  toAddress: string,
  amount: number
): Promise<ethers.TransactionReceipt | null> => {
  try {
    // Convert amount from ether to wei
    const amountWei = ethers.parseEther(amount.toString());

    // Create transaction object
    const tx = {
      to: toAddress,
      value: amountWei,
    };

    // Send the transaction
    const transaction = await signer.sendTransaction(tx);

    // Wait for the transaction to be mined
    const receipt = await transaction.wait();
    return receipt;
  } catch (error) {
    console.error('Error transferring: ', error);
    throw new Error(`Failed to transfer: ${error}`);
  }
};

/**
 * Check if the user has sufficient native currency balance for a transfer
 * @param provider - The ethers provider
 * @param address - The wallet address to check
 * @param amount - The amount of native currency to check against
 * @returns Boolean indicating if the balance is sufficient
 */
export const hasSufficientBalance = async (
  address: string,
  amount: number,
  chainName: string = 'BSC_MAINNET'
): Promise<boolean> => {
  const nativeCurrency =
    chainName === 'BSC_MAINNET'
      ? 'BNB'
      : chainName === 'ETH_MAINNET'
        ? 'ETH'
        : chainName === 'SOMNIA_TESTNET'
          ? 'STT'
          : 'SOL';

  try {
    const provider = getProvider(chainName);
    const balanceWei = await provider.getBalance(address);
    const balanceEther = parseFloat(ethers.formatEther(balanceWei));
    // Leave a small amount for gas
    const gasBuffer = 0.00002; // 0.005 native currency buffer for gas
    return balanceEther >= amount + gasBuffer;
  } catch (error) {
    console.error(`Error checking ${nativeCurrency} balance:`, error);
    throw new Error(`Failed to check ${nativeCurrency} balance: ${error}`);
  }
};

/**
 * Gets token decimals
 * @param tokenAddress The token contract address
 * @returns Token decimals
 */
export async function getTokenDecimals(
  tokenAddress: string,
  chainName: string
): Promise<number> {
  try {
    const provider = getProvider(chainName);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    return await tokenContract.decimals();
  } catch (error) {
    console.error('Failed to get token decimals:', {
      tokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Gets native currency and token balances for an array of wallet addresses
 * @param walletAddresses Array of wallet addresses
 * @param tokenAddress The token contract address
 * @returns Array of wallet balances with formatted numbers
 */
export async function getWalletBalances(
  walletAddresses: string[],
  tokenAddress: string,
  chainName?: string
): Promise<WalletBalance[]> {
  try {
    const provider = getProvider(chainName || 'BSC_MAINNET');
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    const tokenDecimals = await getTokenDecimals(
      tokenAddress,
      chainName || 'BSC_MAINNET'
    );
    const results: WalletBalance[] = [];

    // Process wallets in smaller batches to avoid RPC rate limits (reduced from 3 to 2)
    for (let i = 0; i < walletAddresses.length; i += 5) {
      const walletBatch = walletAddresses.slice(i, i + 5);
      const balancePromises = [];

      // Create promises for both native and token balances
      for (const wallet of walletBatch) {
        balancePromises.push(
          provider.getBalance(wallet),
          tokenContract.balanceOf(wallet)
        );
      }

      // Execute all promises in the batch
      const batchResults = await Promise.all(balancePromises);

      // Process results for this batch
      for (let j = 0; j < walletBatch.length; j++) {
        const nativeBalanceRaw = batchResults[j * 2];
        const tokenBalanceRaw = batchResults[j * 2 + 1];

        results.push({
          address: walletBatch[j],
          nativeBalance: Number(ethers.formatEther(nativeBalanceRaw)),
          tokenBalance: Number(
            ethers.formatUnits(tokenBalanceRaw, tokenDecimals)
          ),
        });
      }

      // Increased delay between batches to avoid rate limits
      if (i + 2 < walletAddresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Increased from 100ms to 500ms
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get wallet balances:', {
      tokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Formats a balance with the correct number of decimals
 * @param balance The raw balance as a string
 * @param decimals The number of decimals
 * @returns Formatted balance
 */
export function formatBalance(balance: string, decimals: number): string {
  const balanceBigInt = BigInt(balance);
  // Use multiplication instead of exponentiation for better compatibility
  let divisor = BigInt(1);
  for (let i = 0; i < decimals; i++) {
    divisor *= BigInt(10);
  }
  const wholePart = (balanceBigInt / divisor).toString();
  const fractionalPart = (balanceBigInt % divisor)
    .toString()
    .padStart(decimals, '0');
  return `${wholePart}.${fractionalPart}`;
}

export async function getTokenOwner(
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET'
): Promise<string> {
  const provider = getProvider(chainName);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await tokenContract.owner();
}

export async function isTokenTradingEnabled(
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET'
): Promise<boolean> {
  const provider = getProvider(chainName);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await tokenContract.swapEnabled();
}

/**
 * Gets the current pool reserves for a token/native currency pair
 * @param tokenAddress The token contract address
 * @returns Pool information including reserves
 */
export async function getPoolInfo(
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET'
): Promise<PoolInfo | null> {
  try {
    const provider = getProvider(chainName);
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const factoryAddress = CHAIN_CONFIGS[chainName].factoryAddress;

    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Get W native currency address
    const wNativeAddress = await router.WETH();

    // Get pair address
    const pairAddress = await factory.getPair(tokenAddress, wNativeAddress);

    // If pair doesn't exist, return null
    if (pairAddress === ethers.ZeroAddress) {
      return null;
    }

    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [token0] = await Promise.all([pair.token0(), pair.token1()]);

    // Get reserves
    const [reserve0, reserve1] = await pair.getReserves();

    // Determine which token is which in the pair
    const [nativeReserve, tokenReserve] =
      token0.toLowerCase() === wNativeAddress.toLowerCase()
        ? [reserve0, reserve1]
        : [reserve1, reserve0];

    return {
      nativeReserve: Number(ethers.formatEther(nativeReserve)),
      tokenReserve: Number(
        ethers.formatUnits(
          tokenReserve,
          await getTokenDecimals(tokenAddress, chainName)
        )
      ),
      tokenAddress,
      nativeAddress: wNativeAddress,
    };
  } catch (error) {
    console.error('Failed to get pool info:', error);
    return null;
  }
}

/**
 * Calculates the snipe amount based on pool liquidity
 * @param tokenAddress The token contract address
 * @param percentageToSnipe Percentage of pool tokens to snipe
 * @param addingLiquidity Whether initial liquidity will be added
 * @param addingTokenAmount Token amount to be added as liquidity (if adding liquidity)
 * @returns Calculated token amount to snipe
 */
export async function calculateSnipeAmount(
  tokenAddress: string,
  percentageToSnipe: number,
  addingLiquidity: boolean = false,
  addingTokenAmount: number = 0
): Promise<number> {
  try {
    const poolInfo = await getPoolInfo(tokenAddress);

    if (!poolInfo && !addingLiquidity) {
      throw new Error(
        'No liquidity pool exists and no initial liquidity is being added'
      );
    }

    // Calculate based on current pool + adding liquidity (if applicable)
    const totalTokensInPool =
      (poolInfo?.tokenReserve || 0) + (addingLiquidity ? addingTokenAmount : 0);

    if (totalTokensInPool === 0) {
      throw new Error('No tokens in pool to calculate snipe amount');
    }

    // Calculate snipe amount based on percentage
    const snipeAmount = totalTokensInPool * (percentageToSnipe / 100);

    return snipeAmount;
  } catch (error) {
    console.error('Failed to calculate snipe amount:', error);
    throw error;
  }
}

/**
 * Checks if the spender has sufficient allowance for the token
 * @param tokenAddress The token contract address
 * @param ownerAddress The token owner address
 * @param spenderAddress The spender address (usually router)
 * @param amount The amount to check allowance for
 * @param signer The ethers signer
 * @returns Boolean indicating if allowance is sufficient
 */
export async function hasTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<boolean> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const allowance = await tokenContract.allowance(
      ownerAddress,
      spenderAddress
    );
    return (
      allowance >=
      safeParseUnits(amount, await getTokenDecimals(tokenAddress, chainName))
    );
  } catch (error) {
    console.error('Failed to check token allowance:', error);
    throw error;
  }
}

/**
 * Approves tokens for a spender
 * @param tokenAddress The token contract address
 * @param spenderAddress The spender address (usually router)
 * @param amount The amount to approve
 * @param signer The ethers signer
 * @returns Transaction receipt
 */
export async function approveTokens(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await getTokenDecimals(tokenAddress, chainName);
    const amountInWei = safeParseUnits(amount, decimals);

    // Approve the tokens
    const tx = await tokenContract.approve(spenderAddress, amountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Failed to approve tokens:', error);
    throw error;
  }
}

/**
 * Adds liquidity to PancakeSwap
 * @param tokenAddress The token contract address
 * @param tokenAmount The amount of tokens to add
 * @param nativeAmount The amount of native currency to add
 * @param signer The ethers signer
 * @returns Transaction receipt
 */
export async function addLiquidity(
  tokenAddress: string,
  tokenAmount: string,
  nativeAmount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const tokenDecimals = await getTokenDecimals(tokenAddress, chainName);

    console.log(`tokenDecimals: ${tokenDecimals}`);
    // Convert amounts to wei
    const tokenAmountInWei = safeParseUnits(tokenAmount, tokenDecimals);
    const nativeAmountInWei = safeParseEther(nativeAmount);

    // Set slippage tolerance (e.g., 5%)
    const slippageTolerance = 0.05;
    const minTokenAmount =
      (tokenAmountInWei * BigInt(Math.floor((1 - slippageTolerance) * 1000))) /
      BigInt(1000);
    const minNativeAmount =
      (nativeAmountInWei * BigInt(Math.floor((1 - slippageTolerance) * 1000))) /
      BigInt(1000);

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    console.log(
      `addLiquidity, tokenAddress: ${tokenAddress}, tokenAmountInWei: ${tokenAmountInWei}, minTokenAmount: ${minTokenAmount}, minNativeAmount: ${minNativeAmount}, signer: ${signer}`
    );

    // Add liquidity
    const tx = await router.addLiquidityETH(
      tokenAddress,
      tokenAmountInWei,
      minTokenAmount,
      minNativeAmount,
      await signer.getAddress(),
      deadline,
      { value: nativeAmountInWei }
    );

    return await tx.wait();
  } catch (error) {
    console.error('Failed to add liquidity:', error);
    throw error;
  }
}

/**
 * Gets the LP token balance for a wallet
 * @param walletAddress The wallet address to check
 * @param tokenAddress The token contract address
 * @returns LP token balance as a number
 */
export async function getLPTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET'
): Promise<number> {
  try {
    const provider = getProvider(chainName);
    // Get the factory address
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const factoryAddress = CHAIN_CONFIGS[chainName].factoryAddress;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Get W native currency address
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const wNativeAddress = await router.WETH();

    // Get the pair address
    const pairAddress = await factory.getPair(tokenAddress, wNativeAddress);

    // If pair doesn't exist, return 0
    if (pairAddress === ethers.ZeroAddress) {
      return 0;
    }

    // Get LP token balance
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const balance = await pairContract.balanceOf(walletAddress);
    const decimals = 18; // LP tokens typically have 18 decimals

    // Convert to number
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error('Failed to get LP token balance:', error);
    return 0;
  }
}

/**
 * Burns liquidity by removing it from PancakeSwap
 * @param signer The ethers signer
 * @param tokenAddress The token contract address
 * @returns Object with success status and optional error message
 */
export async function burnLiquidity(
  signer: ethers.Signer,
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET'
): Promise<{
  success: boolean;
  error?: string;
  tokenAmount?: number;
  nativeAmount?: number;
}> {
  try {
    const walletAddress = await signer.getAddress();

    // Get the factory and router addresses
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const factoryAddress = CHAIN_CONFIGS[chainName].factoryAddress;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);

    // Get W native currency address
    const wNativeAddress = await router.WETH();

    // Get the pair address
    const pairAddress = await factory.getPair(tokenAddress, wNativeAddress);

    // If pair doesn't exist, return error
    if (pairAddress === ethers.ZeroAddress) {
      return { success: false, error: 'Liquidity pool does not exist' };
    }

    // Get LP token balance
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, signer);
    const lpBalance = await pairContract.balanceOf(walletAddress);

    // If no LP tokens, return error
    if (lpBalance === BigInt(0)) {
      return { success: false, error: 'No LP tokens to burn' };
    }

    // Dead address to send LP tokens to (effectively burning them)
    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

    // Transfer LP tokens to dead address
    const transferTx = await pairContract.transfer(DEAD_ADDRESS, lpBalance);
    const receipt = await transferTx.wait();

    if (!receipt.status) {
      return { success: false, error: 'LP token transfer failed' };
    }

    return {
      success: true,
      error: undefined,
    };
  } catch (error) {
    console.error('Failed to burn liquidity:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error burning liquidity',
    };
  }
}

/**
 * Removes liquidity from a PancakeSwap pool
 * @param signer The signer to execute the transaction
 * @param tokenAddress The token address
 * @param percentage The percentage of LP tokens to remove (0-100)
 * @returns Object with success flag, error message, and amounts returned
 */
export async function removeLiquidity(
  signer: ethers.Signer,
  tokenAddress: string,
  percentage: number = 100, // Default to 100% (remove all)
  chainName: string = 'BSC_MAINNET'
): Promise<{
  success: boolean;
  error?: string;
  tokenAmount?: number;
  nativeAmount?: number;
}> {
  try {
    const walletAddress = await signer.getAddress();
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const factoryAddress = CHAIN_CONFIGS[chainName].factoryAddress;

    // Hardcoded W native currency addresses to avoid WETH() call issues
    const wNativeAddress = CHAIN_CONFIGS[chainName].wrappedNativeCurrency;

    // Initialize contracts with provider first to avoid connection issues
    const provider = signer.provider;
    if (!provider) {
      return { success: false, error: 'No provider connected to signer' };
    }

    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);

    // Connect signer to contracts for transactions
    const routerWithSigner = router.connect(signer);

    // Get the pair address
    let pairAddress;
    try {
      // Use explicit typing for the call to avoid linter errors
      pairAddress = (await factory.getPair(
        tokenAddress,
        wNativeAddress
      )) as string;
    } catch (error) {
      console.error('Error getting pair address:', error);
      return { success: false, error: 'Failed to get liquidity pair' };
    }

    // If pair doesn't exist, return error
    if (pairAddress === ethers.ZeroAddress) {
      return { success: false, error: 'Liquidity pool does not exist' };
    }

    // Get LP token balance with proper typing
    const pairContract = new ethers.Contract(
      pairAddress,
      PAIR_ABI,
      provider
    ).connect(signer);
    const lpBalance = (await (pairContract as any).balanceOf(
      walletAddress
    )) as bigint;

    // If no LP tokens, return error
    if (lpBalance === BigInt(0)) {
      return { success: false, error: 'No LP tokens to remove' };
    }

    // Calculate amount to remove based on percentage
    const amountToRemove =
      (lpBalance * BigInt(Math.floor(percentage))) / BigInt(100);

    // Get reserves to estimate returned amounts
    const reserves = (await (pairContract as any).getReserves()) as [
      bigint,
      bigint,
      number,
    ];
    const token0 = (await (pairContract as any).token0()) as string;

    // Determine which token is which in the pair
    const isNativeToken0 =
      token0.toLowerCase() === wNativeAddress.toLowerCase();
    const nativeReserve = isNativeToken0 ? reserves[0] : reserves[1];
    const tokenReserve = isNativeToken0 ? reserves[1] : reserves[0];

    const totalSupply = (await (pairContract as any).totalSupply()) as bigint;

    // Calculate expected returns
    const expectedNative = (nativeReserve * amountToRemove) / totalSupply;
    const expectedTokens = (tokenReserve * amountToRemove) / totalSupply;

    // Approve router to spend LP tokens
    console.log('Approving LP tokens for removal...', {
      routerAddress,
      amountToRemove: amountToRemove.toString(),
    });
    const approveTx = await (pairContract as any).approve(
      routerAddress,
      amountToRemove
    );

    console.log('Approval transaction sent, waiting for confirmation...');
    try {
      // Add timeout to prevent hanging
      const receipt = await Promise.race([
        approveTx.wait(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Approval confirmation timeout')),
            60000
          )
        ),
      ]);
      console.log('LP token approval successful:', receipt?.status);
    } catch (error) {
      console.error('Approval wait failed:', error);
      // Check if transaction was actually confirmed despite the error
      try {
        const currentAllowance = await (pairContract as any).allowance(
          walletAddress,
          routerAddress
        );
        console.log(
          'Current allowance after error:',
          currentAllowance.toString()
        );
        if (currentAllowance >= amountToRemove) {
          console.log(
            'Approval was successful despite wait error, continuing...'
          );
        } else {
          return { success: false, error: 'Token approval failed' };
        }
      } catch (allowanceError) {
        console.error('Failed to check allowance:', allowanceError);
        return { success: false, error: 'Token approval failed' };
      }
    }

    // Calculate minimum amounts (with 5% slippage)
    const minNative = (expectedNative * BigInt(95)) / BigInt(100);
    const minTokens = (expectedTokens * BigInt(95)) / BigInt(100);

    // Current timestamp + 20 minutes
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    console.log('Removing liquidity with parameters:', {
      tokenAddress,
      wNativeAddress,
      amountToRemove: amountToRemove.toString(),
      minTokens: minTokens.toString(),
      minNative: minNative.toString(),
      walletAddress,
      deadline,
      percentage,
    });

    // Remove liquidity - Try with non-ETH method directly as the primary approach
    let receipt;
    try {
      console.log('Attempting removeLiquidity (standard method)...');
      // Use explicit any typing to bypass TypeScript checks since we know the method exists
      const removeTx = await (routerWithSigner as any).removeLiquidity(
        tokenAddress,
        wNativeAddress,
        amountToRemove,
        minTokens,
        minNative,
        walletAddress,
        deadline,
        { gasLimit: 800000 }
      );

      console.log(
        'Remove liquidity transaction sent, waiting for confirmation...'
      );
      try {
        receipt = await Promise.race([
          removeTx.wait(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Remove liquidity confirmation timeout')),
              60000
            )
          ),
        ]);
        console.log('Remove liquidity transaction confirmed:', receipt?.status);
      } catch (waitError) {
        console.error('Remove liquidity wait failed:', waitError);
        throw waitError;
      }
    } catch (routerError) {
      console.error(
        'Error in removeLiquidity, trying ETH specific method:',
        routerError
      );

      try {
        console.log('Attempting removeLiquidityETH (ETH method)...');
        // Try with ETH method as fallback
        const removeTx = await (routerWithSigner as any).removeLiquidityETH(
          tokenAddress,
          amountToRemove,
          minTokens,
          minNative,
          walletAddress,
          deadline,
          { gasLimit: 800000 }
        );

        console.log(
          'Remove liquidity ETH transaction sent, waiting for confirmation...'
        );
        try {
          receipt = await Promise.race([
            removeTx.wait(),
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error('Remove liquidity ETH confirmation timeout')
                  ),
                60000
              )
            ),
          ]);
          console.log(
            'Remove liquidity ETH transaction confirmed:',
            receipt?.status
          );
        } catch (waitError) {
          console.error('Remove liquidity ETH wait failed:', waitError);
          throw waitError;
        }
      } catch (ethError) {
        console.error('Both removal methods failed:', ethError);
        return {
          success: false,
          error:
            'Failed to remove liquidity: ' +
            (ethError instanceof Error ? ethError.message : String(ethError)),
        };
      }
    }

    if (!receipt) {
      console.error('No transaction receipt received');
      return { success: false, error: 'No transaction receipt received' };
    }

    if (receipt.status !== 1) {
      console.error('Transaction failed with status:', receipt.status);
      return {
        success: false,
        error: `Transaction failed with status: ${receipt.status}`,
      };
    }

    console.log('Transaction successful, calculating returned amounts...');

    // Convert to human-readable numbers with 18 decimals for native currency
    const nativeAmount = Number(ethers.formatUnits(expectedNative, 18));

    // Get token decimals with error handling
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    ).connect(signer);
    let tokenDecimals = 18; // Default to 18 decimals
    try {
      tokenDecimals = (await (tokenContract as any).decimals()) as number;
    } catch (error) {
      console.error('Error getting token decimals, using default 18:', error);
    }

    const tokenAmount = Number(
      ethers.formatUnits(expectedTokens, tokenDecimals)
    );

    console.log('Liquidity removal successful:', {
      nativeAmount,
      tokenAmount,
      tokenDecimals,
    });

    return {
      success: true,
      nativeAmount,
      tokenAmount,
      error: undefined,
    };
  } catch (error) {
    console.error('Failed to remove liquidity:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error removing liquidity',
    };
  }
}

/**
 * Gets the current token price in USD
 * @param tokenAddress The token contract address
 * @param pairAddress Optional pair address for the token (if known)
 * @returns The current token price in USD, or null if the price cannot be determined
 */
export async function getTokenPrice(
  tokenAddress: string,
  pairAddress?: string,
  chainName: string = 'BSC_MAINNET'
): Promise<number | null> {
  try {
    // Get native currency price from Redux store
    const state = store.getState();
    const nativeCurrencyPrice =
      state.projects.nativeCurrencyPrice[
        chainName as keyof typeof state.projects.nativeCurrencyPrice
      ];
    console.debug('Current native currency price in USD:', nativeCurrencyPrice);

    const provider = getProvider(chainName);
    // If no pair address is specified, try to find the pair
    if (!pairAddress) {
      const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
      const factoryAddress = CHAIN_CONFIGS[chainName].factoryAddress;
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
      const factory = new ethers.Contract(
        factoryAddress,
        FACTORY_ABI,
        provider
      );

      // Try to find pair with W native currency first
      const wNativeAddress = await router.WETH();
      pairAddress = await factory.getPair(tokenAddress, wNativeAddress);

      // If no W native currency pair, try to find pair with stablecoins
      if (pairAddress === ethers.ZeroAddress) {
        for (const stablecoin of CHAIN_CONFIGS[chainName].stablecoins) {
          pairAddress = await factory.getPair(tokenAddress, stablecoin);
          if (pairAddress !== ethers.ZeroAddress) break;
        }
      }

      // If still no pair found, return null
      if (pairAddress === ethers.ZeroAddress) {
        console.debug('No trading pair found for token:', tokenAddress);
        return null;
      }
    }

    // If pairAddress is still undefined or ZeroAddress, return null
    if (!pairAddress || pairAddress === ethers.ZeroAddress) {
      console.debug('No valid pair address:', tokenAddress);
      return null;
    }

    // Get pair contract
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserves, token0, token1] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.token1(),
    ]);
    const [reserve0, reserve1] = reserves;

    // Get token contract and decimals
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    const [tokenDecimals, pairedTokenDecimals] = await Promise.all([
      tokenContract.decimals(),
      getTokenDecimals(
        token0.toLowerCase() === tokenAddress.toLowerCase() ? token1 : token0,
        chainName
      ),
    ]);

    // Check if paired token is a stablecoin
    const pairedTokenAddress =
      token0.toLowerCase() === tokenAddress.toLowerCase() ? token1 : token0;
    const isPairedWithStablecoin = CHAIN_CONFIGS[chainName].stablecoins.some(
      (stablecoin) =>
        stablecoin.toLowerCase() === pairedTokenAddress.toLowerCase()
    );

    // Convert BigInt reserves to numbers with proper decimal adjustment
    const reserve0Adjusted = Number(
      ethers.formatUnits(
        reserve0,
        token0.toLowerCase() === tokenAddress.toLowerCase()
          ? tokenDecimals
          : pairedTokenDecimals
      )
    );
    const reserve1Adjusted = Number(
      ethers.formatUnits(
        reserve1,
        token1.toLowerCase() === tokenAddress.toLowerCase()
          ? tokenDecimals
          : pairedTokenDecimals
      )
    );

    // Calculate price based on pair type
    let price: number | null = null;

    if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
      // Token is token0
      if (isPairedWithStablecoin) {
        // Token/Stablecoin pair (stablecoin is token1)
        price = reserve1Adjusted / reserve0Adjusted;
      } else if (
        pairedTokenAddress.toLowerCase() ===
        CHAIN_CONFIGS[chainName].wrappedNativeCurrency.toLowerCase()
      ) {
        // Token/W native currency pair (W native currency is token1)
        price = (reserve1Adjusted / reserve0Adjusted) * nativeCurrencyPrice;
      } else {
        // Token/Other pair - try to find the other token's price
        const otherTokenPrice = await getTokenPrice(
          pairedTokenAddress,
          chainName
        );
        price = otherTokenPrice
          ? (reserve1Adjusted / reserve0Adjusted) * otherTokenPrice
          : null;
      }
    } else {
      // Token is token1
      if (isPairedWithStablecoin) {
        // Stablecoin/Token pair (stablecoin is token0)
        price = reserve0Adjusted / reserve1Adjusted;
      } else if (
        pairedTokenAddress.toLowerCase() ===
        CHAIN_CONFIGS[chainName].wrappedNativeCurrency.toLowerCase()
      ) {
        // W native currency/Token pair (W native currency is token0)
        price = (reserve0Adjusted / reserve1Adjusted) * nativeCurrencyPrice;
      } else {
        // Other/Token pair - try to find the other token's price
        const otherTokenPrice = await getTokenPrice(
          pairedTokenAddress,
          chainName
        );
        price = otherTokenPrice
          ? (reserve0Adjusted / reserve1Adjusted) * otherTokenPrice
          : null;
      }
    }

    console.debug('Token price calculated:', {
      tokenAddress,
      pairAddress,
      price,
      pairedWith: pairedTokenAddress,
      isPairedWithStablecoin,
    });

    return price;
  } catch (error) {
    console.error('Failed to get token price:', {
      tokenAddress,
      pairAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Buys tokens with native currency (BNB/ETH)
 * @param signer The ethers signer
 * @param tokenAddress The token address to buy
 * @param amountIn The amount of native currency to spend
 * @param slippageTolerance The maximum allowed slippage (default: 5%)
 * @returns Transaction receipt
 */
export async function buyTokens(
  signer: ethers.Signer,
  tokenAddress: string,
  amountIn: string,
  slippageTolerance: number = 5,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const wNativeAddress = CHAIN_CONFIGS[chainName].wrappedNativeCurrency;

    // Convert amount to wei
    const amountInWei = safeParseEther(amountIn);

    // Calculate minimum amount out with slippage
    const path = [wNativeAddress, tokenAddress];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const amountOutMin =
      (amounts[1] * BigInt(Math.floor((100 - slippageTolerance) * 1000))) /
      BigInt(100000);

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    // Execute swap
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      await signer.getAddress(),
      deadline,
      { value: amountInWei, gasLimit: 500000 }
    );

    return await tx.wait();
  } catch (error) {
    console.error('Failed to buy tokens:', error);
    throw error;
  }
}

/**
 * Sells tokens for native currency (BNB/ETH)
 * @param signer The ethers signer
 * @param tokenAddress The token address to sell
 * @param amountIn The amount of tokens to sell
 * @param slippageTolerance The maximum allowed slippage (default: 5%)
 * @returns Transaction receipt
 */
export async function sellTokens(
  signer: ethers.Signer,
  tokenAddress: string,
  amountIn: string,
  slippageTolerance: number = 5,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const wNativeAddress = CHAIN_CONFIGS[chainName].wrappedNativeCurrency;

    // Get token contract and decimals
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals();

    // Convert amount to wei
    const amountInWei = safeParseUnits(amountIn, Number(decimals));
    console.log('amountInWei', amountInWei);

    // Check allowance
    const allowance = await tokenContract.allowance(
      await signer.getAddress(),
      routerAddress
    );
    if (allowance < amountInWei) {
      const approveTx = await tokenContract.approve(
        routerAddress,
        ethers.MaxUint256
      );
      await approveTx.wait();
    }

    // Calculate minimum amount out with slippage
    const path = [tokenAddress, wNativeAddress];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const amountOutMin =
      (amounts[1] * BigInt(Math.floor((100 - slippageTolerance) * 1000))) /
      BigInt(100000);

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    // Log for debugging
    console.log({
      amountInWei: amountInWei.toString(),
      amountOutMin: amountOutMin.toString(),
      path,
    });

    // Use the supporting fee on transfer function
    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountInWei?.toString(),
      amountOutMin,
      path,
      await signer.getAddress(),
      deadline
    );

    return await tx.wait();
  } catch (error) {
    console.error('Failed to sell tokens:', error);
    throw error;
  }
}

export function safeParseEther(value: string | number): bigint {
  return safeParseUnits(value, 18);
}

export function safeParseUnits(
  value: string | number,
  decimals: number | string | bigint = 18
): bigint {
  try {
    // Ensure decimals is a number, handle BigInt conversion
    let decimalsNum: number;
    if (typeof decimals === 'string') {
      decimalsNum = parseInt(decimals, 10);
    } else if (typeof decimals === 'bigint') {
      decimalsNum = Number(decimals); // Convert BigInt to number
    } else {
      decimalsNum = decimals;
    }

    console.log('safeParseUnits decimals', {
      originalDecimals: decimals,
      decimalsNum,
      decimalsType: typeof decimals,
    });

    // Validate decimals
    if (isNaN(decimalsNum) || decimalsNum < 0 || decimalsNum > 18) {
      console.log('Invalid decimals value, using default 18', {
        originalDecimals: decimals,
        fallbackDecimals: 18,
      });
      return safeParseUnits(value, 18);
    }

    console.log(`[safeParseUnits] input: ${value}`);

    // Use Decimal.js for precise rounding down
    const decimalValue = new Decimal(value);
    const strValue = decimalValue
      .toDecimalPlaces(decimalsNum, Decimal.ROUND_DOWN)
      .toString();

    console.log(`[safeParseUnits] normalized: ${strValue}`);

    return ethers.parseUnits(strValue, decimalsNum);
  } catch (error) {
    console.log('Failed to parse ether value, using fallback', {
      value,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return BigInt(1); // fallback to 1 wei
  }
}
