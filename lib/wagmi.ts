import { http } from 'viem';
import { defineChain } from 'viem';
import {
  bsc,
  mainnet,
  // somniaTestnet
} from 'viem/chains';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Define Somnia Testnet as a viem chain
export const somniaMainnet = defineChain({
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.ankr.com/somnia_mainnet/1f454996729dc64f2e23f2a04624bb2765668e46a367e145f7d767fd12bbb108',
      ],
    },
    public: {
      http: [
        'https://rpc.ankr.com/somnia_mainnet/1f454996729dc64f2e23f2a04624bb2765668e46a367e145f7d767fd12bbb108',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network/',
    },
  },
  testnet: false,
});

export const wagmiConfig = createConfig({
  chains: [
    bsc,
    mainnet,
    // somniaTestnet,
    somniaMainnet,
  ],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
    // [somniaTestnet.id]: http(),
    [somniaMainnet.id]: http(),
  },
});
