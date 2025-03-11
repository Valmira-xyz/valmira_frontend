import { createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'viem/chains';
import { http } from 'viem';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected()
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http()
  }
}); 