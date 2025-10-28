import { http } from 'viem';
import { defineChain } from 'viem';
import { bsc, mainnet } from 'viem/chains';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Define Somnia Testnet as a viem chain
export const somniaTestnet = defineChain({
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
});

export const wagmiConfig = createConfig({
  chains: [bsc, mainnet, somniaTestnet],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
    [somniaTestnet.id]: http(),
  },
});
