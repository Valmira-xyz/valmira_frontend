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
    lastUpdate: string
  }
  isImported?: boolean
  owner: string
  createdAt: string
  updatedAt: string,
  profitTrend?: [],
  volumeTrend?: [],
  logo?: string
}

