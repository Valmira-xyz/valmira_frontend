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
  'function addLiquiditySTT(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
  'function removeLiquiditySTT(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] amounts)',
  'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
  'function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn)',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
];

// Algebra V4 SwapRouter ABI (for QuickSwap on Somnia)
const ALGEBRA_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 limitSqrtPrice)) external payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 limitSqrtPrice)) external payable returns (uint256 amountIn)',
  'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)',
  'function multicall(bytes[] data) external payable returns (bytes[] results)',
  'function refundETH() external payable',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
];

// PancakeSwap V2 Factory ABI (minimal)
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
];

// Algebra V4 Factory ABI (for QuickSwap on Somnia)
const ALGEBRA_FACTORY_ABI = [
  'function poolByPair(address tokenA, address tokenB) external view returns (address pool)',
  'function createPool(address tokenA, address tokenB, bytes calldata data) external returns (address pool)',
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

// Algebra V4 Pool ABI (for QuickSwap on Somnia)
const ALGEBRA_POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
  'function globalState() external view returns (uint160, int24, uint16, uint16, uint8, bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function initialize(uint160 initialPrice) external',
  'function tickSpacing() external view returns (int24)',
  'function plugin() external view returns (address)',
  'function communityVault() external view returns (address)',
];

// Algebra V4 QuoterV2 ABI (for getting swap quotes)
const ALGEBRA_QUOTER_V2_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint160 limitSqrtPrice)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amountOut, uint160 limitSqrtPrice)) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

// Algebra V4 NonfungiblePositionManager ABI (for managing liquidity positions)
// Note: Different Algebra forks have different mint signatures
const ALGEBRA_POSITION_MANAGER_ABI = [
  'function mint((address token0, address token1, address deployer, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function positions(uint256 tokenId) external view returns (uint88 nonce, address operator, address token0, address token1, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)',
  'function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)',
  'function burn(uint256 tokenId) external payable',
  'function refundNativeToken() external payable',
  'function unwrapWNativeToken(uint256 amountMinimum, address recipient) external payable',
  'function sweepToken(address token, uint256 amountMinimum, address recipient) external payable',
  'function WETH9() external view returns (address)',
  'function poolDeployer() external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
];

// Alternative ABI WITHOUT deployer parameter (standard Algebra without Integral)
// Kept for potential future use with different Algebra implementations
const _ALGEBRA_POSITION_MANAGER_ABI_NO_DEPLOYER = [
  'function mint((address token0, address token1, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
];

// WETH/WSOMI ABI (for wrapping native tokens)
const WETH_ABI = [
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
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
  quoterV2Address?: string; // For Algebra V4
  positionManagerAddress?: string; // For Algebra V4
  dexType?: 'uniswapV2' | 'algebraV4'; // DEX protocol type
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
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
      process.env.SOMNIA_TESTNET_RPC_URL ||
      'https://rpc.ankr.com/somnia_testnet/1f454996729dc64f2e23f2a04624bb2765668e46a367e145f7d767fd12bbb108',
    nativeCurrency: 'STT',
    factoryAddress: '0xA9e79B95F2ea2fB089B8F0744CDDA2c22eB00211', // / algbra DEX Factory
    routerAddress: '0xaB93207d3Af2f205f60b30A5b7E4470aFD7936c0', // algebra DEX Router with WSTT support
    disperseAddress: '0xcAE7cDCf4168100377ACc1697d53513aDADd55FA', // To be deployed on Somnia Testnet
    stablecoins: [], // To be configured for Somnia Testnet
    wrappedNativeCurrency: '0xDa928F6A86497b3d3571fC4c2bAD04448Cc756A9', // WSTT (Wrapped STT)
  },
  SOMNIA_MAINNET: {
    rpcUrl:
      process.env.SOMNIA_MAINNET_RPC_URL ||
      'https://rpc.ankr.com/somnia_mainnet/1f454996729dc64f2e23f2a04624bb2765668e46a367e145f7d767fd12bbb108',
    nativeCurrency: 'SOMI',
    factoryAddress: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae', // QuickSwap AlgebraFactory V4
    routerAddress: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44', // QuickSwap SwapRouter
    quoterV2Address: '0xcB68373404a835268D3ED76255C8148578A82b77', // QuickSwap QuoterV2
    positionManagerAddress: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833', // QuickSwap NonfungiblePositionManager
    disperseAddress: '0x40722b4Eb73194eDB6cf518B94b022f1877b0811', // Disperse contract on Somnia Mainnet
    stablecoins: [
      '0x28bec7e30e6faee657a03e19bf1128aad7632a00', // USDC
      '0x67B302E35Aef5EEE8c32D934F5856869EF428330', // USDT
    ],
    wrappedNativeCurrency: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab', // WSOMI (Wrapped SOMI)
    dexType: 'algebraV4',
  },
};

function getProvider(chainName: string): ethers.JsonRpcProvider {
  const chainConfig = CHAIN_CONFIGS[chainName];
  if (!chainConfig) {
    throw new Error(`Unknown chain: ${chainName}`);
  }

  const rpcUrl =
    chainName === 'BSC_MAINNET'
      ? process.env.NEXT_PUBLIC_BSC_RPC_URL || chainConfig.rpcUrl
      : chainName === 'ETH_MAINNET'
        ? process.env.NEXT_PUBLIC_ETH_RPC_URL || chainConfig.rpcUrl
        : chainName === 'SOMNIA_TESTNET'
          ? process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ||
            'https://dream-rpc.somnia.network/'
          : chainName === 'SOMNIA_MAINNET'
            ? process.env.NEXT_PUBLIC_SOMNIA_MAINNET_RPC_URL ||
              chainConfig.rpcUrl
            : chainConfig.rpcUrl;

  return new ethers.JsonRpcProvider(rpcUrl);
}

// Helper function to check if chain uses Algebra V4
function isAlgebraV4(chainName: string): boolean {
  return CHAIN_CONFIGS[chainName]?.dexType === 'algebraV4';
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
          ? 'SOMI'
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
    // const network = await signer.provider?.getNetwork();
    // if(!network){
    //   throw new Error('Network not found');
    // }
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
          ? 'SOMI'
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
 * @param chainName The chain name (used only if providerOrSigner is not provided)
 * @param providerOrSigner Optional provider or signer to use instead of creating new provider
 * @returns Token decimals
 */
export async function getTokenDecimals(
  tokenAddress: string,
  chainName: string,
  providerOrSigner?: ethers.Provider | ethers.Signer
): Promise<number> {
  try {
    const providerToUse = providerOrSigner || getProvider(chainName);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      providerToUse
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
    const chain = chainName || 'BSC_MAINNET';
    const provider = getProvider(chain);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    const tokenDecimals = await getTokenDecimals(tokenAddress, chain);
    const results: WalletBalance[] = [];

    // Configure batch size and delay based on chain
    // Somnia testnet has stricter rate limits and needs smaller batches with longer delays
    const batchSize = chain === 'SOMNIA_TESTNET' ? 3 : 5;
    const batchDelay = chain === 'SOMNIA_TESTNET' ? 1000 : 500;
    const maxRetries = 3;

    // Process wallets in batches to avoid RPC rate limits
    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      const walletBatch = walletAddresses.slice(i, i + batchSize);
      let retryCount = 0;
      let batchSuccess = false;

      while (!batchSuccess && retryCount < maxRetries) {
        try {
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

          batchSuccess = true;
        } catch (batchError) {
          retryCount++;
          console.warn(
            `Batch ${i / batchSize + 1} failed (attempt ${retryCount}/${maxRetries}):`,
            batchError instanceof Error ? batchError.message : 'Unknown error'
          );

          if (retryCount >= maxRetries) {
            throw new Error(
              `Failed to fetch balances after ${maxRetries} retries: ${
                batchError instanceof Error
                  ? batchError.message
                  : 'Unknown error'
              }`
            );
          }

          // Exponential backoff for retries
          await new Promise((resolve) =>
            setTimeout(resolve, batchDelay * retryCount)
          );
        }
      }

      // Delay between batches to avoid rate limits
      if (i + batchSize < walletAddresses.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get wallet balances:', {
      tokenAddress,
      chainName,
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
  chainName: string = 'BSC_MAINNET',
  providerOrSigner?: ethers.Provider | ethers.Signer
): Promise<boolean> {
  const providerToUse = providerOrSigner || getProvider(chainName);
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ERC20_ABI,
    providerToUse
  );
  return await tokenContract.swapEnabled();
}

/**
 * Enables trading for a token (must be called by token owner)
 * @param tokenAddress The token contract address
 * @param signer The ethers signer (must be token owner)
 * @returns Transaction receipt
 */
export async function enableTrading(
  tokenAddress: string,
  signer: ethers.Signer
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await tokenContract.openTrading();
    return await tx.wait();
  } catch (error) {
    console.error('Failed to enable trading:', error);
    throw error;
  }
}

/**
 * Updates the swap tokens at amount threshold (prevents auto-swap if set high)
 * @param tokenAddress The token contract address
 * @param amount The threshold amount (set very high to disable auto-swap)
 * @param signer The ethers signer (must be token owner)
 * @param chainName The chain name
 * @returns Transaction receipt
 */
export async function updateSwapTokensAtAmount(
  tokenAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await getTokenDecimals(tokenAddress, chainName, signer);
    const amountInWei = safeParseUnits(amount, decimals);
    const tx = await tokenContract.updateSwapTokensAtAmount(amountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Failed to update swap tokens at amount:', error);
    throw error;
  }
}

/**
 * Updates the max transaction size (must be called by token owner)
 * @param tokenAddress The token contract address
 * @param amount The new max transaction size in tokens (e.g., "500000000" for 500M tokens)
 * @param signer The ethers signer (must be token owner)
 * @param chainName The chain name
 * @returns Transaction receipt
 */
export async function updateMaxTxnSize(
  tokenAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await getTokenDecimals(tokenAddress, chainName, signer);
    const amountInWei = safeParseUnits(amount, decimals);
    console.log(`Updating maxTxnSize to ${amount} tokens (${amountInWei} wei)`);
    const tx = await tokenContract.updatemaxTxnSize(amountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Failed to update max transaction size:', error);
    throw error;
  }
}

/**
 * Updates the max wallet size (must be called by token owner)
 * @param tokenAddress The token contract address
 * @param amount The new max wallet size in tokens (e.g., "500000000" for 500M tokens)
 * @param signer The ethers signer (must be token owner)
 * @param chainName The chain name
 * @returns Transaction receipt
 */
export async function updateMaxWalletSize(
  tokenAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await getTokenDecimals(tokenAddress, chainName, signer);
    const amountInWei = safeParseUnits(amount, decimals);
    console.log(
      `Updating maxWalletSize to ${amount} tokens (${amountInWei} wei)`
    );
    const tx = await tokenContract.updateMaxWalletSize(amountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Failed to update max wallet size:', error);
    throw error;
  }
}

/**
 * Gets the pair address for a token
 * @param tokenAddress The token contract address
 * @param chainName The chain name
 * @param providerOrSigner Optional provider or signer
 * @returns Pair address
 */
export async function getTokenPairAddress(
  tokenAddress: string,
  chainName: string = 'BSC_MAINNET',
  providerOrSigner?: ethers.Provider | ethers.Signer
): Promise<string> {
  try {
    const providerToUse = providerOrSigner || getProvider(chainName);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      providerToUse
    );
    return await tokenContract.uniswapPair();
  } catch (error) {
    console.error('Failed to get pair address:', error);
    throw error;
  }
}

/**
 * Checks token balance for an address
 * @param tokenAddress The token contract address
 * @param walletAddress The wallet address to check
 * @param providerOrSigner Optional provider or signer
 * @returns Token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  providerOrSigner?: ethers.Provider | ethers.Signer
): Promise<bigint> {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      providerOrSigner
    );
    return await tokenContract.balanceOf(walletAddress);
  } catch (error) {
    console.error('Failed to get token balance:', error);
    throw error;
  }
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
    const chainConfig = CHAIN_CONFIGS[chainName];
    const routerAddress = chainConfig.routerAddress;
    const factoryAddress = chainConfig.factoryAddress;
    const wNativeAddress = chainConfig.wrappedNativeCurrency;

    if (isAlgebraV4(chainName)) {
      // Algebra V4 logic
      const factory = new ethers.Contract(
        factoryAddress,
        ALGEBRA_FACTORY_ABI,
        provider
      );

      // Get pool address using poolByPair
      const poolAddress = await factory.poolByPair(
        tokenAddress,
        wNativeAddress
      );

      // If pool doesn't exist, return null
      if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        return null;
      }

      const pool = new ethers.Contract(poolAddress, ALGEBRA_POOL_ABI, provider);

      // Get token addresses
      const [token0, token1] = await Promise.all([
        pool.token0(),
        pool.token1(),
      ]);

      // Get token balances directly from ERC20 contracts (these are the reserves)
      const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);

      const [token0Balance, token1Balance, token0Decimals, token1Decimals] =
        await Promise.all([
          token0Contract.balanceOf(poolAddress),
          token1Contract.balanceOf(poolAddress),
          token0Contract.decimals(),
          token1Contract.decimals(),
        ]);

      // Determine which token is which
      const isNativeToken0 =
        token0.toLowerCase() === wNativeAddress.toLowerCase();
      const nativeReserve = isNativeToken0 ? token0Balance : token1Balance;
      const tokenReserve = isNativeToken0 ? token1Balance : token0Balance;
      const nativeDecimals = isNativeToken0 ? token0Decimals : token1Decimals;
      const tokenDecimals = isNativeToken0 ? token1Decimals : token0Decimals;

      return {
        nativeReserve: Number(
          ethers.formatUnits(nativeReserve, nativeDecimals)
        ),
        tokenReserve: Number(ethers.formatUnits(tokenReserve, tokenDecimals)),
        tokenAddress,
        nativeAddress: wNativeAddress,
      };
    } else {
      // Uniswap V2 logic (BSC, ETH, etc.)
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
      const factory = new ethers.Contract(
        factoryAddress,
        FACTORY_ABI,
        provider
      );

      // Get W native currency address
      const wNative = await router.WETH();

      // Get pair address
      const pairAddress = await factory.getPair(tokenAddress, wNative);

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
        token0.toLowerCase() === wNative.toLowerCase()
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
        nativeAddress: wNative,
      };
    }
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
      safeParseUnits(
        amount,
        await getTokenDecimals(tokenAddress, chainName, signer)
      )
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
    // Use the signer to get decimals from the correct network
    const decimals = await getTokenDecimals(tokenAddress, chainName, signer);
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
 * Wrap native tokens (ETH/BNB/SOMI) to wrapped version (WETH/WBNB/WSOMI)
 * @param amount The amount to wrap in native token units (e.g., "1.5" for 1.5 SOMI)
 * @param signer The ethers signer
 * @param chainName The chain name
 * @returns Transaction receipt
 */
export async function wrapNativeToken(
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const wrappedNativeAddress = config.wrappedNativeCurrency;

    if (!wrappedNativeAddress) {
      throw new Error('Wrapped native currency not configured for this chain');
    }

    const wNativeContract = new ethers.Contract(
      wrappedNativeAddress,
      WETH_ABI,
      signer
    );

    const amountInWei = safeParseEther(amount);
    console.log(`Wrapping ${amount} native tokens to wrapped version...`);

    const tx = await wNativeContract.deposit({ value: amountInWei });
    const receipt = await tx.wait();
    console.log('✅ Native tokens wrapped successfully');

    return receipt;
  } catch (error) {
    console.error('Failed to wrap native tokens:', error);
    throw error;
  }
}

/**
 * Check if wrapped native token (WSOMI/WETH/WBNB) has sufficient allowance for a spender
 * @param spenderAddress The spender address (Position Manager for Algebra V4)
 * @param amount The amount to check allowance for
 * @param signer The ethers signer
 * @param chainName The chain name
 * @returns True if allowance is sufficient
 */
export async function hasWrappedNativeAllowance(
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<boolean> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const wrappedNativeAddress = config.wrappedNativeCurrency;

    if (!wrappedNativeAddress) {
      throw new Error('Wrapped native currency not configured for this chain');
    }

    const signerAddress = await signer.getAddress();
    const wNativeContract = new ethers.Contract(
      wrappedNativeAddress,
      ERC20_ABI,
      signer
    );

    const allowance = await wNativeContract.allowance(
      signerAddress,
      spenderAddress
    );
    const amountInWei = safeParseEther(amount);

    console.log(
      `Wrapped native allowance: ${ethers.formatEther(allowance)}, required: ${amount}`
    );

    return allowance >= amountInWei;
  } catch (error) {
    console.error('Failed to check wrapped native allowance:', error);
    throw error;
  }
}

/**
 * Get wrapped native token balance
 * @param signer The ethers signer
 * @param chainName The chain name
 * @returns Balance as string in native units
 */
export async function getWrappedNativeBalance(
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<string> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const wrappedNativeAddress = config.wrappedNativeCurrency;

    if (!wrappedNativeAddress) {
      throw new Error('Wrapped native currency not configured for this chain');
    }

    const signerAddress = await signer.getAddress();
    const wNativeContract = new ethers.Contract(
      wrappedNativeAddress,
      ERC20_ABI,
      signer
    );

    const balance = await wNativeContract.balanceOf(signerAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get wrapped native balance:', error);
    throw error;
  }
}

/**
 * Approve wrapped native token (WSOMI/WETH/WBNB) to a spender
 * @param spenderAddress The spender address (Position Manager for Algebra V4)
 * @param amount The amount to approve
 * @param signer The ethers signer
 * @param chainName The chain name
 * @returns Transaction receipt
 */
export async function approveWrappedNative(
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer,
  chainName: string = 'BSC_MAINNET'
): Promise<ethers.TransactionReceipt> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const wrappedNativeAddress = config.wrappedNativeCurrency;

    if (!wrappedNativeAddress) {
      throw new Error('Wrapped native currency not configured for this chain');
    }

    const wNativeContract = new ethers.Contract(
      wrappedNativeAddress,
      ERC20_ABI,
      signer
    );

    // Add 10% buffer to avoid rounding issues
    const amountInWei = safeParseEther(amount);
    const amountWithBuffer = amountInWei + amountInWei / BigInt(10);

    console.log(
      `Approving ${ethers.formatEther(amountWithBuffer)} wrapped native to ${spenderAddress}...`
    );

    const tx = await wNativeContract.approve(spenderAddress, amountWithBuffer);
    const receipt = await tx.wait();
    console.log('✅ Wrapped native token approved');

    return receipt;
  } catch (error) {
    console.error('Failed to approve wrapped native token:', error);
    throw error;
  }
}

/**
 * Helper function to calculate price from amounts (sqrtPriceX96)
 * @param amount0 Amount of token0
 * @param amount1 Amount of token1
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 * @returns sqrtPriceX96
 */
function getSqrtPriceX96(
  amount0: bigint,
  amount1: bigint,
  decimals0: number,
  decimals1: number
): bigint {
  console.log('getSqrtPriceX96 inputs:', {
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    decimals0,
    decimals1,
  });

  // To avoid precision issues with very large BigInts, we'll work with the decimal-adjusted values
  // Convert to strings and use parseFloat for the calculation
  const amount0Decimal = parseFloat(ethers.formatUnits(amount0, decimals0));
  const amount1Decimal = parseFloat(ethers.formatUnits(amount1, decimals1));

  console.log('Decimal amounts:', {
    amount0Decimal,
    amount1Decimal,
  });

  // Calculate price: price = amount1 / amount0
  const price = amount1Decimal / amount0Decimal;

  if (!isFinite(price) || price <= 0) {
    throw new Error(`Invalid price calculation: ${price}`);
  }

  console.log('Price:', price);

  // Calculate sqrt(price)
  const sqrtPrice = Math.sqrt(price);

  console.log('Sqrt price:', sqrtPrice);

  // Multiply by 2^96 to get sqrtPriceX96
  // We use BigInt arithmetic for the final result
  // 2^96 = 79228162514264337593543950336
  const Q96 = 79228162514264337593543950336;
  const sqrtPriceX96Value = sqrtPrice * Q96;

  if (!isFinite(sqrtPriceX96Value) || sqrtPriceX96Value <= 0) {
    throw new Error(`Invalid sqrtPriceX96 calculation: ${sqrtPriceX96Value}`);
  }

  const sqrtPriceX96 = BigInt(Math.floor(sqrtPriceX96Value));

  console.log('sqrtPriceX96 result:', sqrtPriceX96.toString());

  // Sanity check: sqrtPriceX96 should be within reasonable bounds
  // Min: sqrt(10^-12) * 2^96 ≈ 79228162514 (very small price)
  // Max: sqrt(10^12) * 2^96 ≈ 79228162514264337593543950336000000 (very large price)
  const minSqrtPrice = BigInt(79228162514); // ~10^-12 price
  const maxSqrtPrice = BigInt('79228162514264337593543950336000000'); // ~10^12 price

  if (sqrtPriceX96 < minSqrtPrice) {
    console.warn('sqrtPriceX96 is very small:', sqrtPriceX96.toString());
  }
  if (sqrtPriceX96 > maxSqrtPrice) {
    console.warn('sqrtPriceX96 is very large:', sqrtPriceX96.toString());
  }

  return sqrtPriceX96;
}

/**
 * Helper function to get tick from sqrtPriceX96
 * Algebra V4 uses concentrated liquidity with ticks
 */
function getTickFromPrice(sqrtPriceX96: bigint): number {
  const Q96 = BigInt(1) << BigInt(96); // 2^96
  const price = Number((sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96));
  const tick = Math.floor(Math.log(price) / Math.log(1.0001));
  return tick;
}

/**
 * Helper function to get nearest usable tick
 * Algebra V4 requires ticks to be multiples of tickSpacing
 * Kept for potential future use with custom tick ranges
 */
function _getNearestUsableTick(tick: number, tickSpacing: number = 60): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  // Ensure tick is within valid range
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  return Math.max(MIN_TICK, Math.min(MAX_TICK, rounded));
}

/**
 * Initialize a pool for Algebra V4 (if it doesn't exist)
 * @param tokenAddress The token address
 * @param chainName The chain name
 * @param signer The signer
 * @param initialSqrtPrice The initial sqrt price
 */
async function initializeAlgebraPool(
  tokenAddress: string,
  chainName: string,
  signer: ethers.Signer,
  initialSqrtPrice: bigint
): Promise<void> {
  const config = CHAIN_CONFIGS[chainName];
  const factory = new ethers.Contract(
    config.factoryAddress,
    ALGEBRA_FACTORY_ABI,
    signer
  );

  const token0 =
    tokenAddress.toLowerCase() < config.wrappedNativeCurrency.toLowerCase()
      ? tokenAddress
      : config.wrappedNativeCurrency;
  const token1 =
    tokenAddress.toLowerCase() < config.wrappedNativeCurrency.toLowerCase()
      ? config.wrappedNativeCurrency
      : tokenAddress;

  console.log('Checking if pool exists...');
  console.log('Token0:', token0);
  console.log('Token1:', token1);

  // Check if pool exists
  const poolAddress = await factory.poolByPair(token0, token1);
  console.log('Pool address:', poolAddress);

  if (poolAddress === ethers.ZeroAddress) {
    console.log('Pool does not exist, creating pool...');
    // Pool doesn't exist, need to create it
    // For Algebra V4, createPool only needs token addresses (no data parameter needed)
    const tx = await factory.createPool(token0, token1);
    await tx.wait();
    console.log('Pool created successfully');

    // Get the newly created pool address
    const newPoolAddress = await factory.poolByPair(token0, token1);
    console.log('New pool address:', newPoolAddress);

    // Initialize the pool with the initial price
    const pool = new ethers.Contract(newPoolAddress, ALGEBRA_POOL_ABI, signer);

    console.log(
      'Initializing pool with sqrtPriceX96:',
      initialSqrtPrice.toString()
    );
    const initTx = await pool.initialize(initialSqrtPrice);
    await initTx.wait();
    console.log('Pool initialized successfully');
  } else {
    console.log('Pool already exists at:', poolAddress);

    // Check if pool is initialized by checking the liquidity or trying to read globalState
    const pool = new ethers.Contract(poolAddress, ALGEBRA_POOL_ABI, signer);

    try {
      // Try to get globalState - if this works, pool is initialized
      const globalState = await pool.globalState();
      const currentPrice = globalState[0]; // First value is sqrtPriceX96
      const currentTick = globalState[1]; // Second value is tick

      console.log('Pool current sqrtPriceX96:', currentPrice.toString());
      console.log('Pool current tick:', currentTick.toString());

      // If price is 0, pool is not initialized
      if (currentPrice === BigInt(0)) {
        console.log(
          'Pool exists but not initialized (price = 0), initializing...'
        );
        console.log(
          'Initializing pool with sqrtPriceX96:',
          initialSqrtPrice.toString()
        );
        const initTx = await pool.initialize(initialSqrtPrice);
        await initTx.wait();
        console.log('Pool initialized successfully');
      } else {
        console.log('✅ Pool is already initialized');
      }
    } catch (error) {
      console.error('Error checking pool state:', error);
      console.log('Attempting to initialize pool anyway...');
      try {
        const initTx = await pool.initialize(initialSqrtPrice);
        await initTx.wait();
        console.log('Pool initialized successfully');
      } catch {
        console.log(
          'Pool initialization failed or pool is already initialized'
        );
        console.log('Continuing with liquidity addition...');
      }
    }
  }
}

/**
 * Adds liquidity to DEX (PancakeSwap/Uniswap V2 or Algebra V4)
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
    const config = CHAIN_CONFIGS[chainName];
    const signerAddress = await signer.getAddress();

    // Pre-flight checks
    console.log('=== Pre-flight checks for addLiquidity ===');

    // 1. Check token decimals
    const tokenDecimals = await getTokenDecimals(
      tokenAddress,
      chainName,
      signer
    );
    console.log(`Token decimals: ${tokenDecimals}`);

    // 2. Check if trading is enabled

    // 3. Check token balance
    const tokenBalance = await getTokenBalance(
      tokenAddress,
      signerAddress,
      signer
    );
    const tokenAmountInWei = safeParseUnits(tokenAmount, tokenDecimals);
    console.log(
      `Token balance: ${ethers.formatUnits(tokenBalance, tokenDecimals)}`
    );
    console.log(`Token amount to add: ${tokenAmount}`);
    if (tokenBalance < tokenAmountInWei) {
      throw new Error(
        `Insufficient token balance. You have ${ethers.formatUnits(tokenBalance, tokenDecimals)} but trying to add ${tokenAmount}`
      );
    }

    // Convert amounts to wei
    const nativeAmountInWei = safeParseEther(nativeAmount);

    // HANDLE ALGEBRA V4 (QuickSwap concentrated liquidity)
    if (isAlgebraV4(chainName)) {
      console.log('=== Using Algebra V4 NonfungiblePositionManager ===');

      const positionManagerAddress = config.positionManagerAddress;
      if (!positionManagerAddress) {
        throw new Error(
          'Position manager address not configured for this chain'
        );
      }

      const wrappedNative = config.wrappedNativeCurrency;

      // Step 1: Check wrapped token balance and wrap if needed
      console.log('Step 1: Checking wrapped native token balance...');
      const wNativeContract = new ethers.Contract(
        wrappedNative,
        WETH_ABI,
        signer
      );

      const wNativeBalance = await wNativeContract.balanceOf(signerAddress);
      console.log(
        `Wrapped native balance: ${ethers.formatEther(wNativeBalance)}`
      );
      console.log(`Required: ${ethers.formatEther(nativeAmountInWei)}`);

      if (wNativeBalance < nativeAmountInWei) {
        const amountToWrap = nativeAmountInWei - wNativeBalance;
        console.log(
          `Wrapping ${ethers.formatEther(amountToWrap)} native tokens...`
        );
        const wrapTx = await wNativeContract.deposit({ value: amountToWrap });
        await wrapTx.wait();
        console.log('✅ Native tokens wrapped successfully');
      } else {
        console.log('✅ Already have enough wrapped tokens, skipping wrap');
      }

      // Step 2: Approve wrapped native tokens to Position Manager
      console.log('Step 2: Checking wrapped native token approval...');
      const wNativeAllowance = await wNativeContract.allowance(
        signerAddress,
        positionManagerAddress
      );

      // Add a 10% buffer to approval to account for any rounding
      const requiredWNativeAllowance =
        nativeAmountInWei + nativeAmountInWei / BigInt(10);

      if (wNativeAllowance < requiredWNativeAllowance) {
        console.log(
          `Approving WSOMI/WETH to Position Manager (need ${ethers.formatEther(requiredWNativeAllowance)}, have ${ethers.formatEther(wNativeAllowance)})...`
        );
        const approveTx = await wNativeContract.approve(
          positionManagerAddress,
          requiredWNativeAllowance
        );
        await approveTx.wait();
        console.log('✅ WSOMI/WETH approved');
      } else {
        console.log('✅ WSOMI/WETH already approved');
      }

      // Step 3: Check token approval for position manager
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        signer
      );
      const tokenAllowance = await tokenContract.allowance(
        signerAddress,
        positionManagerAddress
      );
      console.log(
        `Token allowance for position manager: ${ethers.formatUnits(tokenAllowance, tokenDecimals)}`
      );
      if (tokenAllowance < tokenAmountInWei) {
        throw new Error(
          `Insufficient token allowance for position manager. Please approve tokens to the Position Manager at ${positionManagerAddress}`
        );
      }

      // Determine token0 and token1 (token0 < token1)
      const isToken0 = tokenAddress.toLowerCase() < wrappedNative.toLowerCase();
      const token0 = isToken0 ? tokenAddress : wrappedNative;
      const token1 = isToken0 ? wrappedNative : tokenAddress;
      const amount0Desired = isToken0 ? tokenAmountInWei : nativeAmountInWei;
      const amount1Desired = isToken0 ? nativeAmountInWei : tokenAmountInWei;

      console.log('Token0:', token0, 'Amount0:', amount0Desired.toString());
      console.log('Token1:', token1, 'Amount1:', amount1Desired.toString());

      // Calculate initial sqrt price
      const nativeDecimals = 18; // Native token is always 18 decimals
      const sqrtPriceX96 = isToken0
        ? getSqrtPriceX96(
            tokenAmountInWei,
            nativeAmountInWei,
            tokenDecimals,
            nativeDecimals
          )
        : getSqrtPriceX96(
            nativeAmountInWei,
            tokenAmountInWei,
            nativeDecimals,
            tokenDecimals
          );

      console.log('Initial sqrtPriceX96:', sqrtPriceX96.toString());

      // Initialize pool if it doesn't exist
      await initializeAlgebraPool(
        tokenAddress,
        chainName,
        signer,
        sqrtPriceX96
      );

      // Get current tick from pool
      const poolAddress = await new ethers.Contract(
        config.factoryAddress,
        ALGEBRA_FACTORY_ABI,
        signer
      ).poolByPair(token0, token1);

      const pool = new ethers.Contract(poolAddress, ALGEBRA_POOL_ABI, signer);

      let currentTick = 0;
      let tickSpacing = 60; // Default tick spacing for QuickSwap

      try {
        const globalState = await pool.globalState();
        currentTick = Number(globalState[1]); // tick is second element
        console.log('Current pool tick:', currentTick);
        console.log('Current pool sqrtPriceX96:', globalState[0].toString());

        // Try to get tick spacing from pool
        try {
          tickSpacing = Number(await pool.tickSpacing());
          console.log('Pool tick spacing:', tickSpacing);
        } catch {
          console.log(
            'Could not read tick spacing, using default:',
            tickSpacing
          );
        }
      } catch {
        console.warn('Could not read pool state, using calculated tick');
        currentTick = getTickFromPrice(sqrtPriceX96);
        console.log('Calculated tick:', currentTick);
      }

      // Use FULL RANGE liquidity for QuickSwap/Algebra V4
      // This provides liquidity across all possible prices (similar to Uniswap V2)
      // QuickSwap uses tick spacing of 60, so full range is -887220 to 887220
      // These values match the successful transaction on QuickSwap Somnia
      // (Math.ceil(-887272 / 60) * 60 = -887220, Math.floor(887272 / 60) * 60 = 887220)
      const QUICKSWAP_TICK_SPACING = 60;
      const tickLower = -887220; // Full range lower tick (with spacing 60)
      const tickUpper = 887220; // Full range upper tick (with spacing 60)

      // Override tickSpacing if it wasn't read correctly
      if (tickSpacing !== QUICKSWAP_TICK_SPACING) {
        console.warn(
          `Tick spacing was ${tickSpacing}, overriding to ${QUICKSWAP_TICK_SPACING} for QuickSwap`
        );
        tickSpacing = QUICKSWAP_TICK_SPACING;
      }

      console.log('=== Using FULL RANGE Liquidity ===');
      console.log('Tick range:', tickLower, 'to', tickUpper, '(Full Range)');
      console.log('Tick spacing:', tickSpacing);
      console.log('Current pool tick:', currentTick);

      // Set slippage tolerance to 1% for safety (pool price may have moved)
      // For initial liquidity, 0.25% works fine, but for subsequent adds we need more tolerance
      const slippageTolerance = 0.01; // 1%
      const slippageMultiplier = BigInt(
        Math.floor((1 - slippageTolerance) * 10000)
      );
      const amount0Min = (amount0Desired * slippageMultiplier) / BigInt(10000);
      const amount1Min = (amount1Desired * slippageMultiplier) / BigInt(10000);

      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

      // Create position manager contract
      const positionManager = new ethers.Contract(
        positionManagerAddress,
        ALGEBRA_POSITION_MANAGER_ABI,
        signer
      );

      console.log('=== Minting Algebra V4 Position ===');
      console.log('Position Manager:', positionManagerAddress);
      console.log('Token0:', token0);
      console.log('Token1:', token1);
      console.log('TickLower:', tickLower);
      console.log('TickUpper:', tickUpper);
      console.log('Amount0Desired:', amount0Desired.toString());
      console.log('Amount1Desired:', amount1Desired.toString());
      console.log('Amount0Min:', amount0Min.toString());
      console.log('Amount1Min:', amount1Min.toString());
      console.log('Recipient:', signerAddress);
      console.log('Deadline:', deadline);

      // Final balance and approval verification
      console.log('=== Final Balance & Approval Check ===');
      const finalWNativeBalance =
        await wNativeContract.balanceOf(signerAddress);
      const finalTokenBalance = await tokenContract.balanceOf(signerAddress);
      const finalWNativeAllowance = await wNativeContract.allowance(
        signerAddress,
        positionManagerAddress
      );
      const finalTokenAllowance = await tokenContract.allowance(
        signerAddress,
        positionManagerAddress
      );

      console.log('WSOMI Balance:', ethers.formatEther(finalWNativeBalance));
      console.log(
        'WSOMI Allowance:',
        ethers.formatEther(finalWNativeAllowance)
      );
      console.log(
        'WSOMI Required (amount0):',
        ethers.formatEther(amount0Desired)
      );
      console.log(
        'Token Balance:',
        ethers.formatUnits(finalTokenBalance, tokenDecimals)
      );
      console.log(
        'Token Allowance:',
        ethers.formatUnits(finalTokenAllowance, tokenDecimals)
      );
      console.log(
        'Token Required (amount1):',
        ethers.formatUnits(amount1Desired, tokenDecimals)
      );

      // Verify balances
      if (isToken0) {
        // token0 is the custom token, token1 is WSOMI
        if (finalTokenBalance < amount0Desired) {
          throw new Error(
            `Insufficient token balance. Have ${ethers.formatUnits(finalTokenBalance, tokenDecimals)}, need ${ethers.formatUnits(amount0Desired, tokenDecimals)}`
          );
        }
        if (finalWNativeBalance < amount1Desired) {
          throw new Error(
            `Insufficient WSOMI balance. Have ${ethers.formatEther(finalWNativeBalance)}, need ${ethers.formatEther(amount1Desired)}`
          );
        }
      } else {
        // token0 is WSOMI, token1 is the custom token
        if (finalWNativeBalance < amount0Desired) {
          throw new Error(
            `Insufficient WSOMI balance. Have ${ethers.formatEther(finalWNativeBalance)}, need ${ethers.formatEther(amount0Desired)}`
          );
        }
        if (finalTokenBalance < amount1Desired) {
          throw new Error(
            `Insufficient token balance. Have ${ethers.formatUnits(finalTokenBalance, tokenDecimals)}, need ${ethers.formatUnits(amount1Desired, tokenDecimals)}`
          );
        }
      }

      // Verify approvals
      if (isToken0) {
        if (finalTokenAllowance < amount0Desired) {
          throw new Error(
            `Insufficient token allowance. Have ${ethers.formatUnits(finalTokenAllowance, tokenDecimals)}, need ${ethers.formatUnits(amount0Desired, tokenDecimals)}`
          );
        }
        if (finalWNativeAllowance < amount1Desired) {
          throw new Error(
            `Insufficient WSOMI allowance. Have ${ethers.formatEther(finalWNativeAllowance)}, need ${ethers.formatEther(amount1Desired)}`
          );
        }
      } else {
        if (finalWNativeAllowance < amount0Desired) {
          throw new Error(
            `Insufficient WSOMI allowance. Have ${ethers.formatEther(finalWNativeAllowance)}, need ${ethers.formatEther(amount0Desired)}`
          );
        }
        if (finalTokenAllowance < amount1Desired) {
          throw new Error(
            `Insufficient token allowance. Have ${ethers.formatUnits(finalTokenAllowance, tokenDecimals)}, need ${ethers.formatUnits(amount1Desired, tokenDecimals)}`
          );
        }
      }

      console.log('✅ All balances and allowances verified');

      // For QuickSwap on Somnia, the deployer parameter should be zero address
      // This matches the successful transaction format:
      // mint((address,address,address,int24,int24,uint256,uint256,uint256,uint256,address,uint256))
      // where deployer = 0x0000000000000000000000000000000000000000
      const poolDeployer = ethers.ZeroAddress;
      console.log('Using zero address as deployer (QuickSwap standard)');

      // Mint params matching the successful transaction format
      const mintParams = [
        token0, // token0 address
        token1, // token1 address
        poolDeployer, // deployer (zero address)
        tickLower, // tickLower (-887220 for full range)
        tickUpper, // tickUpper (887220 for full range)
        amount0Desired, // amount0Desired
        amount1Desired, // amount1Desired
        amount0Min, // amount0Min (with slippage)
        amount1Min, // amount1Min (with slippage)
        signerAddress, // recipient
        deadline, // deadline
      ];

      console.log('=== Mint Parameters ===');
      console.log(
        'Mint params:',
        mintParams.map((p) => p.toString())
      );

      // Try to estimate gas first
      try {
        const gasEstimate = await positionManager.mint.estimateGas(mintParams);
        console.log('Estimated gas:', gasEstimate.toString());
      } catch (estimateError) {
        console.error('Gas estimation failed:', estimateError);
        if (estimateError instanceof Error) {
          const errorMsg = estimateError.message;
          if (errorMsg.includes('tickOutOfRange')) {
            throw new Error(
              'Invalid tick range. The price range is out of bounds.'
            );
          } else if (errorMsg.includes('insufficient')) {
            throw new Error(
              'Insufficient balance or allowance. Please check your token approvals.'
            );
          }
          // Log but continue - sometimes estimation fails but tx succeeds
          console.warn(
            'Gas estimation failed, proceeding with default gas limit...'
          );
        }
      }

      // Execute the mint transaction
      const tx = await positionManager.mint(mintParams, {
        gasLimit: 5000000,
      });

      const receipt = await tx.wait();
      console.log('✅ Algebra V4 Position minted successfully!');
      console.log('Transaction hash:', receipt.hash);

      return receipt;
    }

    // HANDLE UNISWAP V2 STYLE (PancakeSwap, etc.)
    const routerAddress = config.routerAddress;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);

    // 4. Check pair address
    try {
      const pairAddress = await getTokenPairAddress(
        tokenAddress,
        chainName,
        signer
      );
      console.log(`Pair address: ${pairAddress}`);
      if (pairAddress === ethers.ZeroAddress) {
        console.warn('Pair address is zero - pair may not be created yet');
      }
    } catch (e) {
      console.warn('Could not check pair address:', e);
    }

    // 5. Check approval/allowance for router
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    try {
      const allowance = await tokenContract.allowance(
        signerAddress,
        routerAddress
      );
      console.log(
        `Current allowance for router: ${ethers.formatUnits(allowance, tokenDecimals)}`
      );
      if (allowance < tokenAmountInWei) {
        throw new Error(
          `Insufficient allowance. Router has allowance of ${ethers.formatUnits(allowance, tokenDecimals)} but needs ${tokenAmount}. Please approve tokens first.`
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Insufficient allowance')) {
        throw e;
      }
      console.warn('Could not check allowance:', e);
    }

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

    console.log('=== Executing addLiquidityETH ===');
    console.log(`Router: ${routerAddress}`);
    console.log(`Token: ${tokenAddress}`);
    console.log(`Token amount (wei): ${tokenAmountInWei}`);
    console.log(`Native amount (wei): ${nativeAmountInWei}`);
    console.log(`Min token: ${minTokenAmount}`);
    console.log(`Min native: ${minNativeAmount}`);
    console.log(`To: ${signerAddress}`);
    console.log(`Deadline: ${deadline}`);

    // Add liquidity
    const tx = await router.addLiquidityETH(
      tokenAddress,
      tokenAmountInWei,
      minTokenAmount,
      minNativeAmount,
      signerAddress,
      deadline,
      { value: nativeAmountInWei }
    );

    const receipt = await tx.wait();
    console.log('✅ Liquidity added successfully!');

    return receipt;
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
    const chainConfig = CHAIN_CONFIGS[chainName];

    if (isAlgebraV4(chainName)) {
      // Algebra V4 uses concentrated liquidity - LP tokens are NFTs managed by PositionManager
      // For now, return 0 as we don't have a simple way to check NFT positions
      // Users would need to query the NonfungiblePositionManager for their positions
      console.warn(
        'Algebra V4 uses NFT-based liquidity positions. LP balance check not supported via this function.'
      );
      return 0;
    }

    // Uniswap V2 logic
    const routerAddress = chainConfig.routerAddress;
    const factoryAddress = chainConfig.factoryAddress;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Get W native currency address
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const wNative = await router.WETH();

    // Get the pair address
    const pairAddress = await factory.getPair(tokenAddress, wNative);

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
 * Helper function to get all NFT positions for a user from Algebra V4 Position Manager
 * @param positionManagerAddress The position manager address
 * @param walletAddress The user's wallet address
 * @param signer The signer
 * @returns Array of token IDs owned by the user
 */
async function getAlgebraPositions(
  positionManagerAddress: string,
  walletAddress: string,
  signer: ethers.Signer
): Promise<bigint[]> {
  const positionManager = new ethers.Contract(
    positionManagerAddress,
    [
      'function balanceOf(address owner) external view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
    ],
    signer
  );

  const balance = await positionManager.balanceOf(walletAddress);
  const positions: bigint[] = [];

  for (let i = 0; i < Number(balance); i++) {
    const tokenId = await positionManager.tokenOfOwnerByIndex(walletAddress, i);
    positions.push(tokenId);
  }

  return positions;
}

/**
 * Helper function to get position details from Algebra V4 Position Manager
 * @param positionManagerAddress The position manager address
 * @param tokenId The NFT token ID
 * @param signer The signer
 * @returns Position details
 */
async function getAlgebraPositionDetails(
  positionManagerAddress: string,
  tokenId: bigint,
  signer: ethers.Signer
): Promise<{
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}> {
  const positionManager = new ethers.Contract(
    positionManagerAddress,
    ALGEBRA_POSITION_MANAGER_ABI,
    signer
  );

  const position = await positionManager.positions(tokenId);

  return {
    token0: position.token0,
    token1: position.token1,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: position.liquidity,
  };
}

/**
 * Remove liquidity from Algebra V4 position (concentrated liquidity)
 * @param signer The signer
 * @param tokenAddress The token address
 * @param tokenId The NFT position ID (optional, will use first position if not provided)
 * @param percentage Percentage of liquidity to remove (0-100)
 * @param chainName The chain name
 * @returns Object with success flag, error message, and amounts returned
 */
async function removeAlgebraV4Liquidity(
  signer: ethers.Signer,
  tokenAddress: string,
  tokenId: bigint | null,
  percentage: number,
  chainName: string
): Promise<{
  success: boolean;
  error?: string;
  tokenAmount?: number;
  nativeAmount?: number;
  tokenId?: string;
}> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const positionManagerAddress = config.positionManagerAddress;

    if (!positionManagerAddress) {
      return {
        success: false,
        error: 'Position manager address not configured for this chain',
      };
    }

    const walletAddress = await signer.getAddress();
    const positionManager = new ethers.Contract(
      positionManagerAddress,
      ALGEBRA_POSITION_MANAGER_ABI,
      signer
    );

    // If tokenId not provided, find the first position for this token pair
    let positionTokenId = tokenId;
    if (!positionTokenId) {
      console.log('Finding positions for wallet:', walletAddress);
      const positions = await getAlgebraPositions(
        positionManagerAddress,
        walletAddress,
        signer
      );

      if (positions.length === 0) {
        return {
          success: false,
          error: 'No liquidity positions found for this wallet',
        };
      }

      // Find position matching the token pair
      const wrappedNative = config.wrappedNativeCurrency;
      for (const pos of positions) {
        const details = await getAlgebraPositionDetails(
          positionManagerAddress,
          pos,
          signer
        );

        // Check if this position matches our token pair
        const hasToken =
          details.token0.toLowerCase() === tokenAddress.toLowerCase() ||
          details.token1.toLowerCase() === tokenAddress.toLowerCase();
        const hasWrappedNative =
          details.token0.toLowerCase() === wrappedNative.toLowerCase() ||
          details.token1.toLowerCase() === wrappedNative.toLowerCase();

        if (hasToken && hasWrappedNative && details.liquidity > 0) {
          positionTokenId = pos;
          break;
        }
      }

      if (!positionTokenId) {
        return {
          success: false,
          error: 'No liquidity position found for this token pair',
        };
      }
    }

    console.log('Using position NFT ID:', positionTokenId.toString());

    // Get position details
    const positionDetails = await getAlgebraPositionDetails(
      positionManagerAddress,
      positionTokenId,
      signer
    );

    console.log('Position details:', {
      token0: positionDetails.token0,
      token1: positionDetails.token1,
      liquidity: positionDetails.liquidity.toString(),
    });

    if (positionDetails.liquidity === BigInt(0)) {
      return {
        success: false,
        error: 'Position has no liquidity',
      };
    }

    // Calculate amount of liquidity to remove
    const liquidityToRemove =
      (positionDetails.liquidity * BigInt(percentage)) / BigInt(100);

    console.log('Removing liquidity:', liquidityToRemove.toString());

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

    // Decrease liquidity (with 5% slippage)
    const decreaseParams = {
      tokenId: positionTokenId,
      liquidity: liquidityToRemove,
      amount0Min: 0, // We'll set to 0 for simplicity, but you can calculate based on current price
      amount1Min: 0,
      deadline: deadline,
    };

    console.log('Decreasing liquidity with params:', decreaseParams);
    const decreaseTx = await positionManager.decreaseLiquidity(decreaseParams);
    const _decreaseReceipt = await decreaseTx.wait();
    console.log('✅ Liquidity decreased successfully');

    // Collect the tokens
    const collectParams = {
      tokenId: positionTokenId,
      recipient: walletAddress,
      amount0Max: ethers.MaxUint256, // Collect all available
      amount1Max: ethers.MaxUint256,
    };

    console.log('Collecting tokens...');
    const collectTx = await positionManager.collect(collectParams);
    const _collectReceipt = await collectTx.wait();
    console.log('✅ Tokens collected successfully');

    // Parse events to get amounts (simplified - you may want to parse actual events)
    return {
      success: true,
      tokenId: positionTokenId.toString(),
      tokenAmount: 0, // Would need to parse events for actual amounts
      nativeAmount: 0,
    };
  } catch (error) {
    console.error('Failed to remove Algebra V4 liquidity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Burn an empty Algebra V4 NFT position
 * @param signer The signer
 * @param tokenId The NFT position ID
 * @param chainName The chain name
 * @returns Object with success flag and error message
 */
export async function burnAlgebraV4Position(
  signer: ethers.Signer,
  tokenId: bigint,
  chainName: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const positionManagerAddress = config.positionManagerAddress;

    if (!positionManagerAddress) {
      return {
        success: false,
        error: 'Position manager address not configured for this chain',
      };
    }

    const positionManager = new ethers.Contract(
      positionManagerAddress,
      ALGEBRA_POSITION_MANAGER_ABI,
      signer
    );

    // Check if position has liquidity
    const positionDetails = await getAlgebraPositionDetails(
      positionManagerAddress,
      tokenId,
      signer
    );

    if (positionDetails.liquidity > 0) {
      return {
        success: false,
        error: 'Cannot burn position with liquidity. Remove liquidity first.',
      };
    }

    console.log('Burning NFT position:', tokenId.toString());
    const burnTx = await positionManager.burn(tokenId);
    await burnTx.wait();
    console.log('✅ NFT position burned successfully');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to burn Algebra V4 position:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all Algebra V4 positions for a wallet
 * @param signer The signer
 * @param chainName The chain name
 * @returns Array of position details
 */
export async function getAlgebraV4Positions(
  signer: ethers.Signer,
  chainName: string
): Promise<{
  success: boolean;
  error?: string;
  positions?: Array<{
    tokenId: string;
    token0: string;
    token1: string;
    liquidity: string;
    tickLower: number;
    tickUpper: number;
  }>;
}> {
  try {
    const config = CHAIN_CONFIGS[chainName];
    const positionManagerAddress = config.positionManagerAddress;

    if (!positionManagerAddress) {
      return {
        success: false,
        error: 'Position manager address not configured for this chain',
      };
    }

    const walletAddress = await signer.getAddress();
    const tokenIds = await getAlgebraPositions(
      positionManagerAddress,
      walletAddress,
      signer
    );

    const positions = [];
    for (const tokenId of tokenIds) {
      const details = await getAlgebraPositionDetails(
        positionManagerAddress,
        tokenId,
        signer
      );

      positions.push({
        tokenId: tokenId.toString(),
        token0: details.token0,
        token1: details.token1,
        liquidity: details.liquidity.toString(),
        tickLower: details.tickLower,
        tickUpper: details.tickUpper,
      });
    }

    return {
      success: true,
      positions,
    };
  } catch (error) {
    console.error('Failed to get Algebra V4 positions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Removes liquidity from a DEX pool (PancakeSwap/Uniswap V2 or Algebra V4)
 * @param signer The signer to execute the transaction
 * @param tokenAddress The token address
 * @param percentage The percentage of LP tokens to remove (0-100)
 * @param chainName The chain name
 * @param tokenId Optional NFT token ID for Algebra V4 positions
 * @returns Object with success flag, error message, and amounts returned
 */
export async function removeLiquidity(
  signer: ethers.Signer,
  tokenAddress: string,
  percentage: number = 100, // Default to 100% (remove all)
  chainName: string = 'BSC_MAINNET',
  tokenId?: bigint | null
): Promise<{
  success: boolean;
  error?: string;
  tokenAmount?: number;
  nativeAmount?: number;
  tokenId?: string;
}> {
  try {
    // Handle Algebra V4 (concentrated liquidity)
    if (isAlgebraV4(chainName)) {
      return await removeAlgebraV4Liquidity(
        signer,
        tokenAddress,
        tokenId || null,
        percentage,
        chainName
      );
    }

    // Handle Uniswap V2-style DEXes (below is the existing implementation)

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
        deadline
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
 * Helper function to calculate price from sqrtPriceX96 (Algebra V4)
 */
function calculatePriceFromSqrtPriceX96(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
  token0IsNative: boolean
): number {
  // sqrtPriceX96 = sqrt(price) * 2^96
  // price = (sqrtPriceX96 / 2^96)^2
  const Q96 = BigInt(2 ** 96);
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  const price = sqrtPrice * sqrtPrice;

  // Adjust for decimals
  const decimalsAdjustment =
    Math.pow(10, token0Decimals) / Math.pow(10, token1Decimals);

  if (token0IsNative) {
    // price is native/token, so token price = 1 / price * decimalsAdjustment
    return (1 / price) * decimalsAdjustment;
  } else {
    // price is token/native, so token price = price * decimalsAdjustment
    return price * decimalsAdjustment;
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
    const chainConfig = CHAIN_CONFIGS[chainName];
    const wNativeAddress = chainConfig.wrappedNativeCurrency;

    // If no pair address is specified, try to find the pool/pair
    if (!pairAddress) {
      const factoryAddress = chainConfig.factoryAddress;

      if (isAlgebraV4(chainName)) {
        // Algebra V4 logic
        const factory = new ethers.Contract(
          factoryAddress,
          ALGEBRA_FACTORY_ABI,
          provider
        );

        // Try to find pool with W native currency first
        pairAddress = await factory.poolByPair(tokenAddress, wNativeAddress);

        // If no W native currency pool, try to find pool with stablecoins
        if (!pairAddress || pairAddress === ethers.ZeroAddress) {
          for (const stablecoin of chainConfig.stablecoins) {
            pairAddress = await factory.poolByPair(tokenAddress, stablecoin);
            if (pairAddress && pairAddress !== ethers.ZeroAddress) break;
          }
        }
      } else {
        // Uniswap V2 logic
        const routerAddress = chainConfig.routerAddress;
        const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
        const factory = new ethers.Contract(
          factoryAddress,
          FACTORY_ABI,
          provider
        );

        // Try to find pair with W native currency first
        const wNative = await router.WETH();
        pairAddress = await factory.getPair(tokenAddress, wNative);

        // If no W native currency pair, try to find pair with stablecoins
        if (pairAddress === ethers.ZeroAddress) {
          for (const stablecoin of chainConfig.stablecoins) {
            pairAddress = await factory.getPair(tokenAddress, stablecoin);
            if (pairAddress !== ethers.ZeroAddress) break;
          }
        }
      }

      // If still no pool/pair found, return null
      if (!pairAddress || pairAddress === ethers.ZeroAddress) {
        console.debug('No trading pair found for token:', tokenAddress);
        return null;
      }
    }

    // If pairAddress is still undefined or ZeroAddress, return null
    if (!pairAddress || pairAddress === ethers.ZeroAddress) {
      console.debug('No valid pair address:', tokenAddress);
      return null;
    }

    if (isAlgebraV4(chainName)) {
      // Algebra V4 logic - use globalState to get price
      const poolContract = new ethers.Contract(
        pairAddress,
        ALGEBRA_POOL_ABI,
        provider
      );

      const [token0, token1, globalState] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.globalState(),
      ]);

      const sqrtPriceX96 = globalState[0]; // First element is price
      const token0IsNative =
        token0.toLowerCase() === wNativeAddress.toLowerCase();

      // Get decimals
      const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);
      const [token0Decimals, token1Decimals] = await Promise.all([
        token0Contract.decimals(),
        token1Contract.decimals(),
      ]);

      // Calculate price from sqrtPriceX96
      const priceInNative = calculatePriceFromSqrtPriceX96(
        sqrtPriceX96,
        Number(token0Decimals),
        Number(token1Decimals),
        token0IsNative
      );

      // Convert to USD
      const priceInUSD = priceInNative * (nativeCurrencyPrice || 0);

      console.debug('Token price calculated (Algebra V4):', {
        tokenAddress,
        pairAddress,
        priceInUSD,
        priceInNative,
        nativeCurrencyPrice,
      });

      return priceInUSD;
    } else {
      // Uniswap V2 logic
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
    }
  } catch (error: unknown) {
    console.error('Failed to get token price:', {
      tokenAddress,
      pairAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Buys tokens with native currency (BNB/ETH/SOMI)
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
    const chainConfig = CHAIN_CONFIGS[chainName];
    const routerAddress = chainConfig.routerAddress;
    const wNativeAddress = chainConfig.wrappedNativeCurrency;

    // Convert amount to wei
    const amountInWei = safeParseEther(amountIn);

    if (isAlgebraV4(chainName)) {
      // Algebra V4 logic
      const router = new ethers.Contract(
        routerAddress,
        ALGEBRA_ROUTER_ABI,
        signer
      );

      // Use QuoterV2 to get quote
      const quoterV2Address = chainConfig.quoterV2Address;
      if (!quoterV2Address) {
        throw new Error('QuoterV2 address not configured for Algebra V4');
      }

      const quoter = new ethers.Contract(
        quoterV2Address,
        ALGEBRA_QUOTER_V2_ABI,
        signer.provider
      );

      // Get quote for exact input
      const quote = await quoter.quoteExactInputSingle.staticCall({
        tokenIn: wNativeAddress,
        tokenOut: tokenAddress,
        amountIn: amountInWei,
        limitSqrtPrice: 0, // No price limit
      });

      const amountOut = quote[0]; // First element is amountOut
      const amountOutMin =
        (amountOut * BigInt(Math.floor((100 - slippageTolerance) * 1000))) /
        BigInt(100000);

      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

      // Execute swap using exactInputSingle
      const tx = await router.exactInputSingle(
        {
          tokenIn: wNativeAddress,
          tokenOut: tokenAddress,
          recipient: await signer.getAddress(),
          deadline: deadline,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMin,
          limitSqrtPrice: 0, // No price limit
        },
        { value: amountInWei, gasLimit: 500000 }
      );

      return await tx.wait();
    } else {
      // Uniswap V2 logic (BSC, ETH, etc.)
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);

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
    }
  } catch (error) {
    console.error('Failed to buy tokens:', error);
    throw error;
  }
}

/**
 * Sells tokens for native currency (BNB/ETH/SOMI)
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
    const chainConfig = CHAIN_CONFIGS[chainName];
    const routerAddress = chainConfig.routerAddress;
    const wNativeAddress = chainConfig.wrappedNativeCurrency;

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

    if (isAlgebraV4(chainName)) {
      // Algebra V4 logic
      const router = new ethers.Contract(
        routerAddress,
        ALGEBRA_ROUTER_ABI,
        signer
      );

      // Use QuoterV2 to get quote
      const quoterV2Address = chainConfig.quoterV2Address;
      if (!quoterV2Address) {
        throw new Error('QuoterV2 address not configured for Algebra V4');
      }

      const quoter = new ethers.Contract(
        quoterV2Address,
        ALGEBRA_QUOTER_V2_ABI,
        signer.provider
      );

      // Get quote for exact input
      const quote = await quoter.quoteExactInputSingle.staticCall({
        tokenIn: tokenAddress,
        tokenOut: wNativeAddress,
        amountIn: amountInWei,
        limitSqrtPrice: 0, // No price limit
      });

      const amountOut = quote[0]; // First element is amountOut
      const amountOutMin =
        (amountOut * BigInt(Math.floor((100 - slippageTolerance) * 1000))) /
        BigInt(100000);

      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

      // Execute swap using exactInputSingle
      const tx = await router.exactInputSingle(
        {
          tokenIn: tokenAddress,
          tokenOut: wNativeAddress,
          recipient: await signer.getAddress(),
          deadline: deadline,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMin,
          limitSqrtPrice: 0, // No price limit
        },
        { gasLimit: 500000 }
      );

      return await tx.wait();
    } else {
      // Uniswap V2 logic (BSC, ETH, etc.)
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);

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
      const tx =
        await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountInWei?.toString(),
          amountOutMin,
          path,
          await signer.getAddress(),
          deadline
        );

      return await tx.wait();
    }
  } catch (error) {
    console.error('Failed to sell tokens:', error);
    throw error;
  }
}
