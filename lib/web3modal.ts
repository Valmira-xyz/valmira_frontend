import {  bsc, bscTestnet } from '@reown/appkit/networks'
import { createWeb3Modal } from '@web3modal/wagmi/react'

// config/index.tsx

import { cookieStorage, createStorage} from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Get projectId from https://cloud.reown.com
export const projectId = '5900003232869af56bb0fb6703c5af28'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [bsc, bscTestnet]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
