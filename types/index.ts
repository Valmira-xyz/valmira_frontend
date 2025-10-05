export interface GlobalMetrics {
  totalProjects: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  totalFundsManaged: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  aggregateTradingVolume: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  activeBotsRunning: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  aggregateProfits: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  lastUpdated: string;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | ProjectWithAddons | null;
  loading: boolean;
  error: string | null;
  volumeData: any | null;
  projectStats: ProjectStatistics | null;
  nativePrice: number | null;
  nativePriceLoading: boolean;
  ethPrice: number | null;
  ethPriceLoading: boolean;
  globalMetrics: GlobalMetrics | null;
  nativeCurrencyPrice: {
    BSC_MAINNET: number;
    ETH_MAINNET: number;
  };
}

export interface ProjectMetrics {
  cumulativeProfit: number;
  tradingVolume: number;
  activeBots: number;
  lastUpdate: Date;
  liquidity?: number;
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export interface ProjectTrends {
  profitTrend: TimeSeriesDataPoint[];
  volumeTrend: TimeSeriesDataPoint[];
}

export interface BotPerformance {
  botName: string;
  status: 'Active' | 'Inactive' | 'Error';
  trades: number;
  profitContribution: number;
  uptime: number;
  lastUpdated: Date;
}

export interface ActivityLog {
  timestamp: Date;
  botName: string;
  action: string;
  volume: number;
  impact: number;
}

export interface ProjectStatistics {
  metrics: ProjectMetrics;
  trends: ProjectTrends;
  botPerformance: Array<{
    botId: string;
    botName: string;
    status: 'Active' | 'Inactive' | 'Error';
    trades: number;
    profit: number;
    uptime: string;
    date: string;
    profitContribution: number;
    lastUpdated: Date;
  }>;
  recentActivity: ActivityLog[];
  timeRange: {
    start: Date;
    end: Date;
  };
  _lastUpdateTimestamp?: number;
}

export interface ProjectAnalyticsProps {
  project?: Project;
  trends?: ProjectTrends;
  botPerformance?: BotPerformance[];
  recentActivity?: ActivityLog[];
}

// User related types
export interface User {
  _id: string;
  walletAddress: string;
  role: 'user' | 'admin';
  telegramUserUsername?: string;
  name?: string;
  email?: string;
  nonce?: string;
  projects?: any[];
  referralCode?: string;
}

// Deployment related types
export interface SocialLinks {
  websiteLink?: string;
  telegramLink?: string;
  twitterLink?: string;
  discordLink?: string;
}

export interface DeploymentParams {
  tokenName: string;
  tokenSymbol: string;
  tokenTotalSupply: string;
  buyFee: number;
  sellFee: number;
  maxHoldingLimit_: number;
  maxBuyLimit_: number;
  maxSellLimit_: number;
  socialLinks: SocialLinks;
  templateNumber: number;
}

export interface VerificationParams {
  deployedAddress: string;
  constructorArguments: any[];
  templateNumber: number;
  customContractPath: string;
  tokenName: string;
}

export interface DeploymentStatus {
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface ContractResponse {
  success: boolean;
  message?: string;
  byteCode?: string;
  path?: string;
  abi: any[];
}

export interface DeploymentJobResponse {
  success: boolean;
  message?: string;
  jobId: string;
  contractAddress: string;
}

export interface JobStatusResponse {
  success: boolean;
  message?: string;
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  status?: number;
}

// Auth related types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface NonceResponse {
  nonce: string;
}

export interface VerifyResponse {
  user: User;
  token: string;
}

// Project related types
export interface Project {
  addons: any;
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  tokenAddress: string;
  pairAddress: string;
  userId: string;
  chainName: string;
  owner:
    | string
    | {
        _id: string;
        walletAddress: string;
        role: string;
      };
  metrics?: {
    cumulativeProfit: number;
    tradingVolume: number;
    activeBots: number;
    lastUpdate: string;
  };
}

export interface MigrationResponse {
  status: string;
  message?: string;
  data?: Project | ProjectWithAddons | any;
}

// Wallet related types
export interface Wallet {
  _id: string;
  publicKey: string;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  nativeBalance?: number;
  tokenBalance?: number;
  nativeToSpend?: number;
}

// Auth State type
export interface AuthState {
  user: User | null;
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  projects: any[];
}

export interface PoolInfo {
  nativeReserve: number;
  tokenReserve: number;
  tokenAddress: string;
  nativeAddress: string;
}

// Wallet State type
export interface WalletState {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  selectedWallet: Wallet | null;
}

// Wallet Balance type
export interface WalletBalance {
  address: string;
  nativeBalance: number;
  tokenBalance: number;
}

// Wallet related types
export interface WalletsResponse {
  wallets: Wallet[];
  total: number;
}

// Wallet related types
export interface BalancesResponse {
  balances: WalletBalance[];
}

export interface ProjectWithAddons {
  tokenDecimals: number;
  _id: string;
  name: string;
  tokenAddress: string;
  pairAddress: string;
  chainId: number;
  chainName: string;
  symbol?: string;
  totalSupply?: number;
  status: string;
  isImported: boolean;
  owner:
    | {
        _id: string;
        walletAddress: string;
        nonce: string;
        role: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
        nonceCounter: number;
      }
    | string;
  addons: {
    SnipeBot: {
      generatedHolders: number | undefined;
      generatedVolume: number | undefined;
      _id?: string;
      isEnabled?: boolean;
      status?: string;
      depositWalletId: {
        _id: string;
        publicKey: string;
      };
      subWalletIds: {
        role: string;
        _id: string;
        publicKey: string;
      }[];
    };
    VolumeBot: {
      generatedVolume: number | undefined;
      _id?: string;
      isEnabled?: boolean;
      depositWalletId: {
        publicKey: string;
      };
    };
    HolderBot: {
      generatedHolders: number | undefined;
      _id?: string;
      isEnabled?: boolean;
      depositWalletId: {
        publicKey: string;
      };
    };
    AutoSellBot?: {
      countsOfActivaveWallets: number | undefined;
      _id?: string;
      isEnabled?: boolean;
      status?: string;
      depositWalletId: {
        _id: string;
        publicKey: string;
      };
      subWalletIds: {
        role: string;
        _id: string;
        publicKey: string;
      }[];
    };
    DistributionBot?: {
      _id?: string;
      isEnabled?: boolean;
      status?: string;
      depositWalletId: {
        publicKey: string;
      };
      subWalletIds: {
        role: string;
        _id: string;
        publicKey: string;
      }[];
    };
    TrendingBot?: {
      generatedVolume: number | undefined;
      _id?: string;
      isEnabled?: boolean;
      status?: string;
      depositWalletId: {
        publicKey: string;
      };
      minNativeAmount?: number;
      maxNativeAmount?: number;
      upwardSellRateMin?: number;
      upwardSellRateMax?: number;
      downwardSellRateMin?: number;
      downwardSellRateMax?: number;
      timeSpanBetweenTransactions?: number;
      trend?: 'upward' | 'downward';
      targetMinutes?: number;
      elapsedMinutes?: number;
    };
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  metrics: {
    cumulativeProfit: number;
    tradingVolume: number;
    activeBots: number;
    lastUpdate: string;
  };
  containingBots?: any;
}

// Bot related types
export type BotType =
  | 'SnipeBot'
  | 'VolumeBot'
  | 'HolderBot'
  | 'AutoSellBot'
  | 'DistributionBot'
  | 'TrendingBot';
export type BotStatus =
  | 'ready_to_simulation'
  | 'simulating'
  | 'simulation_failed'
  | 'simulation_succeeded'
  | 'sniping'
  | 'snipe_succeeded'
  | 'snipe_failed'
  | 'auto_selling'
  | 'selling'
  | 'sell_failed'
  | 'sell_succeeded'
  | 'Inactive';
export type Speed = 'slow' | 'medium' | 'fast';

export interface AutoSellConfig {
  targetPrice: number;
  stopLoss: number;
  speed: Speed;
}

export interface BotWallet {
  address: string;
  balance: number;
  tokenAmount: number;
  status: BotStatus;
}

export interface BotConfig {
  botType: BotType;
  projectId: string;
  tokenAddress: string;
  pairAddress: string;
  chainId: number;
  wallets: BotWallet[];
  status: BotStatus;
  autoSellConfig?: AutoSellConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BotsState {
  bots: BotConfig[];
  loading: boolean;
  error: string | null;
}

export interface BotResponse {
  status: string;
  message: string;
  data: BotConfig[];
}

// Token related types
export type TokenImportStatus = 'idle' | 'validating' | 'valid' | 'invalid';
export type TokenDeploymentStatus = 'idle' | 'deploying' | 'success' | 'error';

export interface TokenValidationState {
  status: TokenImportStatus;
  error: string | null;
  tokenInfo: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  } | null;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string;
}

// Session and Wallet context types
export interface SessionContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}

export interface WalletContextType {
  walletAddress: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Ambassador related types - Updated to match backend structure
export interface AmbassadorOverview {
  totalEarned: number;
  availableBalance: number;
  directReferrals: number;
  indirectReferrals: number;
  conversionRate: number;
  averageEarningPerReferral: number;
  // Additional calculated fields for frontend
  todayEarnings?: number;
  weeklyEarnings?: number;
  monthlyEarnings?: number;
  mostProfitableReferral?: string;
  rank?: string;
}

// Backend returns DailyEarnings format
export interface DailyEarnings {
  date: string;
  earnings: number;
}

// Backend returns FeeBreakdownItem format
export interface FeeBreakdownItem {
  timestamp: string;
  referredUser: string;
  feeAmount: number;
  yourCommission: number;
}

// For compatibility with existing components, we'll map backend data to this format
export interface AmbassadorEarningsBreakdown {
  projectName: string;
  dailyBotFee: string;
  numberOfBots: number;
  totalFee: string;
  percentage: string;
  earnings: string;
  date: string;
}

export interface AmbassadorFeeBreakdown {
  projectName: string;
  dailyBotFee: string;
  numberOfBots: number;
  totalFee: string;
  percentage: string;
  earnings: string;
  date: string;
}

export interface AmbassadorPaymentSettings {
  paymentMethod: 'stablecoins' | 'ethereum';
  network: string;
  preferredStableCoin?: string;
  paymentAddress: string;
  automaticWithdrawals: boolean;
  withdrawalThreshold: number;
}

export interface AmbassadorPaymentHistory {
  date: string;
  amount: string;
  to: string;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash: string;
}

// Backend DirectReferralItem structure
export interface BackendDirectReferralItem {
  id: string;
  username: string;
  joinedDate: string;
  status: 'active' | 'inactive';
  totalCommissionEarned: number;
}

// Frontend compatible structure
export interface DirectReferralItem {
  projectName: string;
  date: Date;
  dailyBotFee: number;
  monthlyFee: number;
  percentage: number;
  earnings: number;
  status: 'Active' | 'Inactive' | 'Pending';
  action: string;
}

export interface IndirectReferralItem {
  projectName: string;
  date: Date;
  dailyBotFee: number;
  monthlyFee: number;
  percentage: number;
  earnings: number;
  status: 'Active' | 'Inactive' | 'Pending';
  action: string;
}

export interface AmbassadorReferralStats {
  joinedMembers: number;
  clicks: number;
  directReferralEarnings: number;
}
