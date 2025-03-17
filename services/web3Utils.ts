import { ethers } from 'ethers';
import MemeTemplateJson from '@/lib/deploy-token/abi/MemeTemplate.json';

const ERC20_ABI = MemeTemplateJson.abi;

// PancakeSwap V2 Router ABI (minimal)
const ROUTER_ABI = [
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"
];

// PancakeSwap V2 Factory ABI (minimal)
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

// PancakeSwap V2 Pair ABI (minimal)
const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function balanceOf(address owner) external view returns (uint)",
  "function totalSupply() external view returns (uint)",
  "function allowance(address owner, address spender) external view returns (uint)",
  "function approve(address spender, uint value) external returns (bool)",
  "function transfer(address to, uint value) external returns (bool)"
];

// PancakeSwap V2 addresses
const PANCAKESWAP_ADDRESSES = {
  mainnet: {
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  },
  testnet: {
    router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    factory: '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
  }
};

// Network type definition
type Network = 'mainnet' | 'testnet';

// Common token addresses on BSC
const BSC_TOKENS: Record<Network, Record<string, string>> = {
  mainnet: {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  },
  testnet: {
    WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    BUSD: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
  }
};


// Initialize provider based on network
const network = (process.env.NETWORK || 'mainnet') as Network;
const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL || (network === 'mainnet' 
  ? 'https://bsc-dataseed.binance.org/'
  : 'https://data-seed-prebsc-1-s1.binance.org:8545/');

const provider = new ethers.JsonRpcProvider(rpcUrl);

interface WalletBalance {
  address: string;
  bnbBalance: number;
  tokenAmount: number;
}

interface PoolInfo {
  bnbReserve: number;
  tokenReserve: number;
  tokenAddress: string;
  bnbAddress: string;
}

/**
 * Gets token decimals
 * @param tokenAddress The token contract address
 * @returns Token decimals
 */
async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.decimals();
  } catch (error) {
    console.error('Failed to get token decimals:', {
      tokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Gets BNB and token balances for an array of wallet addresses
 * @param walletAddresses Array of wallet addresses
 * @param tokenAddress The token contract address
 * @returns Array of wallet balances with formatted numbers
 */
export async function getWalletBalances(
  walletAddresses: string[],
  tokenAddress: string
): Promise<WalletBalance[]> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const tokenDecimals = await getTokenDecimals(tokenAddress);
    let results: WalletBalance[] = [];

    // Process wallets in batches of 3 to avoid RPC rate limits
    for (let i = 0; i < walletAddresses.length; i += 3) {
      const walletBatch = walletAddresses.slice(i, i + 3);
      const balancePromises = [];

      // Create promises for both BNB and token balances
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
        const bnbBalanceRaw = batchResults[j * 2];
        const tokenBalanceRaw = batchResults[j * 2 + 1];

        results.push({
          address: walletBatch[j],
          bnbBalance: Number(ethers.formatEther(bnbBalanceRaw)),
          tokenAmount: Number(ethers.formatUnits(tokenBalanceRaw, tokenDecimals))
        });
      }

      // Add a small delay between batches to avoid rate limits
      if (i + 3 < walletAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get wallet balances:', {
      tokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  const fractionalPart = (balanceBigInt % divisor).toString().padStart(decimals, '0');
  return `${wholePart}.${fractionalPart}`;
}

export async function getTokenOwner(tokenAddress: string): Promise<string> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await tokenContract.owner();
}

export async function isTokenTradingEnabled(tokenAddress: string): Promise<boolean> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await tokenContract.swapEnabled();
}

/**
 * Gets the current pool reserves for a token/BNB pair
 * @param tokenAddress The token contract address
 * @returns Pool information including reserves
 */
export async function getPoolInfo(tokenAddress: string): Promise<PoolInfo | null> {
  try {
    const routerAddress = PANCAKESWAP_ADDRESSES[network].router;
    const factoryAddress = PANCAKESWAP_ADDRESSES[network].factory;
    
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    
    // Get WBNB address
    const wbnbAddress = await router.WETH();
    
    // Get pair address
    const pairAddress = await factory.getPair(tokenAddress, wbnbAddress);
    
    // If pair doesn't exist, return null
    if (pairAddress === ethers.ZeroAddress) {
      return null;
    }
    
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [token0, token1] = await Promise.all([
      pair.token0(),
      pair.token1()
    ]);
    
    // Get reserves
    const [reserve0, reserve1] = await pair.getReserves();
    
    // Determine which token is which in the pair
    const [bnbReserve, tokenReserve] = token0.toLowerCase() === wbnbAddress.toLowerCase()
      ? [reserve0, reserve1]
      : [reserve1, reserve0];
    
    return {
      bnbReserve: Number(ethers.formatEther(bnbReserve)),
      tokenReserve: Number(ethers.formatUnits(tokenReserve, await getTokenDecimals(tokenAddress))),
      tokenAddress,
      bnbAddress: wbnbAddress
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
      throw new Error('No liquidity pool exists and no initial liquidity is being added');
    }
    
    // Calculate based on current pool + adding liquidity (if applicable)
    const totalTokensInPool = (poolInfo?.tokenReserve || 0) + (addingLiquidity ? addingTokenAmount : 0);
    
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
  signer: ethers.Signer
): Promise<boolean> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
    return allowance >= ethers.parseUnits(amount, await getTokenDecimals(tokenAddress));
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
  signer: ethers.Signer
): Promise<ethers.TransactionReceipt> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await getTokenDecimals(tokenAddress);
    const amountInWei = ethers.parseUnits(amount, decimals);
    
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
 * @param bnbAmount The amount of BNB to add
 * @param signer The ethers signer
 * @returns Transaction receipt
 */
export async function addLiquidity(
  tokenAddress: string,
  tokenAmount: string,
  bnbAmount: string,
  signer: ethers.Signer
): Promise<ethers.TransactionReceipt> {
  try {
    const routerAddress = PANCAKESWAP_ADDRESSES[network].router;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const tokenDecimals = await getTokenDecimals(tokenAddress);
    
    // Convert amounts to wei
    const tokenAmountInWei = ethers.parseUnits(tokenAmount, tokenDecimals);
    const bnbAmountInWei = ethers.parseEther(bnbAmount);
    
    // Set slippage tolerance (e.g., 5%)
    const slippageTolerance = 0.05;
    const minTokenAmount = tokenAmountInWei * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / BigInt(1000);
    const minBnbAmount = bnbAmountInWei * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / BigInt(1000);
    
    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
    
    // Add liquidity
    const tx = await router.addLiquidityETH(
      tokenAddress,
      tokenAmountInWei,
      minTokenAmount,
      minBnbAmount,
      await signer.getAddress(),
      deadline,
      { value: bnbAmountInWei }
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
  tokenAddress: string
): Promise<number> {
  try {
    // Get the factory address
    const routerAddress = PANCAKESWAP_ADDRESSES[network].router;
    const factoryAddress = PANCAKESWAP_ADDRESSES[network].factory;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    
    // Get WBNB address
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const wbnbAddress = await router.WETH();
    
    // Get the pair address
    const pairAddress = await factory.getPair(tokenAddress, wbnbAddress);
    
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
  tokenAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const walletAddress = await signer.getAddress();
    
    // Get the factory and router addresses
    const routerAddress = PANCAKESWAP_ADDRESSES[network].router;
    const factoryAddress = PANCAKESWAP_ADDRESSES[network].factory;
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    
    // Get WBNB address
    const wbnbAddress = await router.WETH();
    
    // Get the pair address
    const pairAddress = await factory.getPair(tokenAddress, wbnbAddress);
    
    // If pair doesn't exist, return error
    if (pairAddress === ethers.ZeroAddress) {
      return { success: false, error: "Liquidity pool does not exist" };
    }
    
    // Get LP token balance
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, signer);
    const lpBalance = await pairContract.balanceOf(walletAddress);
    
    // If no LP tokens, return error
    if (lpBalance === BigInt(0)) {
      return { success: false, error: "No LP tokens to burn" };
    }
    
    // Dead address to send LP tokens to (effectively burning them)
    const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
    
    // Transfer LP tokens to dead address
    const transferTx = await pairContract.transfer(DEAD_ADDRESS, lpBalance);
    const receipt = await transferTx.wait();
    
    if (!receipt.status) {
      return { success: false, error: "LP token transfer failed" };
    }
    
    return { 
      success: true,
      error: undefined
    };
  } catch (error) {
    console.error('Failed to burn liquidity:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

