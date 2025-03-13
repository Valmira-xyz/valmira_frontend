export type Project = {
  _id: string
  name?: string
  tokenAddress: string
  pairAddress: string
  chainId: number
  chainName: string
  status: 'active' | 'inactive'
  metrics: {
    cumulativeProfit: number
    volume24h: number
    activeBots: number
    lastUpdate: Date | string
  }
  addons: {
    LiquidationSnipeBot: string | {
      depositWalletId: string | {
        publicKey: string
      },
      subWalletIds: string[] | {
        publicKey: string
      }[]
    }
    VolumeBot: string | {
      depositWalletId: string | {
        publicKey: string
      }
    }
    HolderBot: string | {
      depositWalletId: string | {
        publicKey: string
      }
    }
  }
  isImported?: boolean
  owner: string | {
    walletAddress: string
  }
  createdAt: Date | string
  updatedAt: Date | string
  profitTrend?: []
  volumeTrend?: []
  logo?: string
}

