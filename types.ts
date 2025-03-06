export type Project = {
  id: string
  name: string
  logo?: string
  blockchain: string
  contractAddress: string
  status: "Active" | "Pending" | "Paused"
  cumulativeProfit: number
  tradingVolume24h: number
  activeBots: number
  profitTrend?: number[]
  volumeTrend?: number[]
  liquidity?: number
  lastUpdated?: string
  apy?: number
  tvl?: number
  walletAddress?: string
}

