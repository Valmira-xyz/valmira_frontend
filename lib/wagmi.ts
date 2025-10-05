import { http } from 'viem';
import { bsc, mainnet } from 'viem/chains';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [bsc, mainnet],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
  },
});
