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
  bnbPrice: number | null;
  bnbPriceLoading: boolean;
  globalMetrics: GlobalMetrics | null;
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
  name?: string;
  role: 'user' | 'admin';
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
  message?: string;
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
  bnbBalance?: number;
  tokenAmount?: number;
  bnbToSpend?: number;
}

// Auth State type
export interface AuthState {
  user: User | null;
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  projects: Project[];
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
  bnbBalance: number;
  tokenAmount: number;
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
}

export interface ProjectHeaderProps {
  project?: ProjectWithAddons;
  walletAddress?: string;
  projectId: string;
}

// Bot related types
export type BotType = 'SnipeBot' | 'VolumeBot' | 'HolderBot' | 'AutoSellBot';
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
