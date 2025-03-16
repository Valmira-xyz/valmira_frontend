import { ethers } from 'ethers';
import MemeTemplateJson from '@/lib/deploy-token/abi/MemeTemplate.json';

const ERC20_ABI = MemeTemplateJson.abi;

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

