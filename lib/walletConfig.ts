import { cookieStorage, createStorage } from 'wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';
// import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { bsc, bscTestnet, mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || '5900003232869af56bb0fb6703c5af28';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Somnia Testnet configuration
export const somniaTestnet: AppKitNetwork = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon-explorer.somnia.network/',
    },
  },
  testnet: true,
};

export const networks = [mainnet, bsc, bscTestnet, sepolia, somniaTestnet] as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const config = wagmiAdapter.wagmiConfig;
