import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, digits?: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: digits || 2,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value);
}

export const generateAvatarColor = (address: string): string => {
  if (!address) return `hsl(0, 70%, 60%)`;

  const hash = address
    .toLowerCase()
    .split('')
    .reduce((a, b) => {
      return ((a << 5) - a + b.charCodeAt(0)) | 0;
    }, 0);

  return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
};

// Determine badge color based on status
export const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'Paused':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const genRandomSparklineData = (length: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

export const getChainName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return 'ETH_MAINNET';
    case 56:
      return 'BSC_MAINNET';
    case 50312:
      return 'SOMNIA_TESTNET';
    case 5031:
      return 'SOMNIA_MAINNET';
    default:
      return 'UNKNOWN';
  }
};

// Network detection utilities with enhanced BSC detection
export const detectNetworkFromAddress = (address: string): string => {
  if (!address) return 'ETH_MAINNET';

  // Convert to lowercase for consistent comparison
  const lowerAddress = address.toLowerCase();

  // Basic pattern detection for different networks
  if (lowerAddress.startsWith('0x')) {
    // Common BSC token contract patterns (this is heuristic-based)
    // BSC often has contracts with specific patterns, but this is not foolproof
    // In practice, you'd want to check against known contract registries or use API calls

    // For now, we'll use a simple heuristic: longer addresses with certain hex patterns
    // often indicate BSC usage based on common BSC patterns
    const hexPart = lowerAddress.substring(2);

    // This is a simplified heuristic - in production you'd want more sophisticated detection
    // BSC addresses containing certain patterns that are common in BSC ecosystem
    if (
      hexPart.includes('bb4cdb') || // WBNB-related
      hexPart.includes('55d398') || // USDT on BSC
      hexPart.includes('8ac76a')
    ) {
      // USDC on BSC
      return 'BSC_MAINNET';
    }

    // Default to Ethereum for 0x addresses
    return 'ETH_MAINNET';
  }

  // For Solana addresses (base58 encoded, typically 32-44 characters)
  if (address.length >= 32 && address.length <= 44 && !/^0x/.test(address)) {
    return 'SOLANA_MAINNET';
  }

  return 'ETH_MAINNET';
};

export const getBlockExplorerUrl = (
  address: string,
  chainName?: string,
  type: 'token' | 'address' = 'address'
): string => {
  const detectedChain = chainName || detectNetworkFromAddress(address);

  switch (detectedChain) {
    case 'BSC_MAINNET':
      return `https://bscscan.com/${type}/${address}`;
    case 'ETH_MAINNET':
      return `https://etherscan.io/${type}/${address}`;
    case 'SOMNIA_TESTNET':
      return `https://shannon-explorer.somnia.network/${type}/${address}`;
    case 'SOMNIA_MAINNET':
      return `https://explorer.somnia.network/${type}/${address}`;
    case 'SOLANA_MAINNET':
      // Solana uses different endpoints for tokens vs addresses
      return type === 'token'
        ? `https://solscan.io/token/${address}`
        : `https://solscan.io/account/${address}`;
    default:
      // Default to Ethereum explorer
      return `https://etherscan.io/${type}/${address}`;
  }
};

export const formatAddress = (
  address: string,
  displayLength: number = 6,
  showEnd: boolean = true
): string => {
  if (!address) return '';
  const start = address.substring(0, displayLength);
  const end = showEnd ? address.substring(address.length - displayLength) : '';
  return `${start}...${end}`;
};
