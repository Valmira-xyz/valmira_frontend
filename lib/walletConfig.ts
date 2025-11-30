import { somniaMainnet } from './wagmi';
import { cookieStorage, createStorage } from 'wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';
// import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { bsc, mainnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || '5900003232869af56bb0fb6703c5af28';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [mainnet, bsc, somniaMainnet] as [
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
