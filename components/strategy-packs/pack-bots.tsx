'use client';

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/utils';
import { BotService } from '@/services/botService';
import { walletApi } from '@/services/walletApi';
import { getNativeBalance, getWalletBalances } from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { toggleBot } from '@/store/slices/botSlice';
import { fetchPackById } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

import { Button } from '../ui/button';

// Lazy load dialog components
const NativeDepositDialog = lazy(() =>
  import('@/components/projects/native-deposit-dialog').then((module) => ({
    default: module.NativeDepositDialog,
  }))
);

const ManualSwapDialog = lazy(() =>
  import('@/components/projects/manual-swap-dialog').then((module) => ({
    default: module.ManualSwapDialog,
  }))
);

const ManualLPDialog = lazy(() =>
  import('@/components/projects/manual-lp-dialog').then((module) => ({
    default: module.ManualLPDialog,
  }))
);

const WalletManagementModal = lazy(() =>
  import('@/components/projects/wallet-management-modal').then((module) => ({
    default: module.WalletManagementModal,
  }))
);

const DistributionBotDialog = lazy(() =>
  import('@/components/projects/distribution-bot-dialog').then((module) => ({
    default: module.DistributionBotDialog,
  }))
);

const TrendingBotDialog = lazy(() =>
  import('@/components/projects/trending-bot-wizard-dialog').then((module) => ({
    default: module.TrendingBotWizardDialog,
  }))
);

const AutoSellBotDialog = lazy(() =>
  import('@/components/projects/auto-sell-wizard-dialog').then((module) => ({
    default: module.AutoSellWizardDialog,
  }))
);

interface PackBotsProps {
  project: ProjectWithAddons;
}

// Define the pack bot structure
type PackBotType = {
  type: string;
  config: any;
  depositWallet: string;
  nativeBalance: number;
  tokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
  totalTokenBalance?: number;
  countsOfActiveWallets?: number;
  completedDistributions?: number;
  totalDistributions?: number;
  elapsedMinutes?: number;
  targetMinutes?: number;
  trend?: 'upward' | 'downward';
  _id?: string;
  enabled?: boolean;
};

// Initialize pack bots with empty values
const initialPackBots: PackBotType[] = [
  {
    type: `SnipeBot`,
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    tokenBalance: 0,
    enabled: false,
  },
  {
    type: `DistributionBot`,
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    tokenBalance: 0,
    completedDistributions: 0,
    totalDistributions: 0,
    enabled: false,
  },
  {
    type: 'VolumeBot',
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    generatedVolume: 0,
    enabled: false,
  },
  {
    type: 'HolderBot',
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    generatedHolders: 0,
    enabled: false,
  },
  {
    type: 'AutoSellBot',
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    totalTokenBalance: 0,
    countsOfActiveWallets: 0,
    enabled: false,
  },
  {
    type: 'TrendingBot',
    config: null,
    depositWallet: '',
    nativeBalance: 0,
    tokenBalance: 0,
    generatedVolume: 0,
    targetMinutes: 0,
    enabled: false,
  },
];

interface BotStepperProps {
  packConfig: any;
  packEnabled: boolean;
  botCompletionStates: { [key: string]: boolean };
  currentExecutingBot: string | null;
}

// Wallet info interface for post-operation modal
interface WalletInfo {
  _id?: string;
  publicKey: string;
  role: string;
  nativeBalance?: number;
  tokenBalance?: number;
  sellPercentage?: number;
  isSelectedForMutilSell?: boolean;
  nativeSpendRate?: number;
}

// Bot configuration icons
const getBotIcon = (botType: string) => {
  switch (botType) {
    case `SnipeBot`:
      return <Zap className="h-5 w-5" />;
    case 'VolumeBot':
      return <Volume2 className="h-5 w-5" />;
    case 'HolderBot':
      return <Users className="h-5 w-5" />;
    case 'AutoSellBot':
      return <TrendingUp className="h-5 w-5" />;
    case `DistributionBot`:
      return <Target className="h-5 w-5" />;
    case 'TrendingBot':
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <Bot className="h-5 w-5" />;
  }
};

// Bot configuration names
const getBotName = (botType: string) => {
  switch (botType) {
    case `SnipeBot`:
      return 'Snipe Bot';
    case 'VolumeBot':
      return 'Volume Bot';
    case 'HolderBot':
      return 'Holder Bot';
    case 'AutoSellBot':
      return 'Auto Sell Bot';
    case `DistributionBot`:
      return 'Distribution Bot';
    case 'TrendingBot':
      return 'Trending Bot';
    default:
      return 'Bot';
  }
};

// Bot configuration descriptions
const getBotDescription = (botType: string) => {
  switch (botType) {
    case `SnipeBot`:
      return 'You can perform first sniping with multiple user wallets in the same bundle transaction.';
    case 'VolumeBot':
      return "Boost your token's trading volume with automated buy and sell transactions.";
    case 'HolderBot':
      return 'Simulate a diverse holder base by distributing tokens across multiple wallets.';
    case 'AutoSellBot':
      return 'Automatically sell tokens when the price reaches a certain target.';
    case `DistributionBot`:
      return 'Distribute tokens across multiple wallets with customizable timing and amounts.';
    case 'TrendingBot':
      return 'Generate upward or downward trading volume';
    default:
      return 'Automated trading bot';
  }
};

// Get tutorial links
const getTutorialLink = (botType: string) => {
  switch (botType) {
    case `SnipeBot`:
      return '/tutorials/add-ons/bundle-snipe';
    case 'VolumeBot':
      return '/tutorials/add-ons/volume-bot';
    case 'HolderBot':
      return '/tutorials/add-ons/holder-bot';
    case 'AutoSellBot':
      return '/tutorials/add-ons/auto-sell';
    case `DistributionBot`:
      return '/tutorials/add-ons/distribution-bot';
    case 'TrendingBot':
      return '/tutorials/add-ons/trending-bot';
    default:
      return null;
  }
};

// Get bot goal description
const getBotGoal = (botType: string, config: any) => {
  switch (botType) {
    case `SnipeBot`:
      return `Snipe ${formatNumber(config?.tokenAmount || 0)} tokens with ${config?.walletCount || 0} wallets`;
    case 'VolumeBot':
      return `Generate $${formatNumber(config?.targetVolume || 0)} trading volume`;
    case 'HolderBot':
      return `Reach ${formatNumber(config?.targetHolders || 0)} token holders`;
    case 'AutoSellBot':
      return `Target: $${config?.targetPrice || 1} , Stop Loss: $${config?.stopLoss || 1}`;
    case `DistributionBot`:
      return `Distribute tokens to ${formatNumber(config?.targetWalletCount || 0)} wallets`;
    case 'TrendingBot':
      return `Generate ${config?.trend || 'upward'} trending volume for ${config?.targetMinutes || 0} minutes`;
    default:
      return 'Complete bot objectives';
  }
};

function BotStepper({
  packConfig,
  packEnabled,
  botCompletionStates,
  currentExecutingBot,
}: BotStepperProps) {
  if (!packConfig) return null;

  const botConfigs = [
    {
      type: `SnipeBot`,
      config: packConfig.snipeBotConfig,
      backendType: 'SnipeBot',
    },
    {
      type: `DistributionBot`,
      config: packConfig.distributionBotConfig,
      backendType: 'DistributionBot',
    },
    {
      type: 'VolumeBot',
      config: packConfig.volumeBotConfig,
      backendType: 'VolumeBot',
    },
    {
      type: 'HolderBot',
      config: packConfig.holderBotConfig,
      backendType: 'HolderBot',
    },
    {
      type: 'AutoSellBot',
      config: packConfig.autoSellBotConfig,
      backendType: 'AutoSellBot',
    },
    {
      type: 'TrendingBot',
      config: packConfig.trendingBotConfig,
      backendType: 'TrendingBot',
    },
  ].filter((bot) => bot.config); // Only show configured bots

  // Use real-time completion states instead of config.achieved
  const completedSteps = botConfigs.filter(
    (bot) => botCompletionStates[bot.backendType]
  ).length;

  const totalSteps = botConfigs.length;
  const progressPercentage =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Pack Progress
        </CardTitle>
        <CardDescription>
          Track the completion status of each bot in your pack
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>
              {completedSteps}/{totalSteps} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Separator />

        {/* Bot Steps */}
        <div className="space-y-4">
          {botConfigs.map((bot, index) => {
            const isCompleted = botCompletionStates[bot.backendType] || false;
            const isActive =
              !isCompleted && bot.backendType === currentExecutingBot; // Currently executing bot

            return (
              <div key={bot.type} className="flex items-start gap-3">
                {/* Step Indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                          ? 'bg-primary border-primary text-white animate-pulse'
                          : 'bg-background border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isActive ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Circle className="h-3 w-3 fill-current" />
                    )}
                  </div>
                  {index < botConfigs.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getBotIcon(bot.type)}
                    <h4 className="font-medium text-sm">
                      {getBotName(bot.type)}
                    </h4>
                    <Badge
                      variant={
                        botCompletionStates[
                          bot.type === `SnipeBot`
                            ? 'SnipeBot'
                            : bot.type === 'VolumeBot'
                              ? 'VolumeBot'
                              : bot.type === 'HolderBot'
                                ? 'HolderBot'
                                : bot.type === 'AutoSellBot'
                                  ? 'AutoSellBot'
                                  : bot.type === 'TrendingBot'
                                    ? 'TrendingBot'
                                    : 'DistributionBot'
                        ]
                          ? 'default'
                          : currentExecutingBot ===
                              (bot.type === `SnipeBot`
                                ? 'SnipeBot'
                                : bot.type === 'VolumeBot'
                                  ? 'VolumeBot'
                                  : bot.type === 'HolderBot'
                                    ? 'HolderBot'
                                    : bot.type === 'AutoSellBot'
                                      ? 'AutoSellBot'
                                      : bot.type === 'TrendingBot'
                                        ? 'TrendingBot'
                                        : 'DistributionBot')
                            ? 'secondary'
                            : 'outline'
                      }
                      className="font-medium text-sm px-3 py-1 rounded-full"
                    >
                      {botCompletionStates[
                        bot.type === `SnipeBot`
                          ? 'SnipeBot'
                          : bot.type === 'VolumeBot'
                            ? 'VolumeBot'
                            : bot.type === 'HolderBot'
                              ? 'HolderBot'
                              : bot.type === 'AutoSellBot'
                                ? 'AutoSellBot'
                                : bot.type === 'TrendingBot'
                                  ? 'TrendingBot'
                                  : 'DistributionBot'
                      ]
                        ? 'Completed'
                        : currentExecutingBot ===
                            (bot.type === `SnipeBot`
                              ? 'SnipeBot'
                              : bot.type === 'VolumeBot'
                                ? 'VolumeBot'
                                : bot.type === 'HolderBot'
                                  ? 'HolderBot'
                                  : bot.type === 'AutoSellBot'
                                    ? 'AutoSellBot'
                                    : bot.type === 'TrendingBot'
                                      ? 'TrendingBot'
                                      : 'DistributionBot')
                          ? 'Running'
                          : packEnabled
                            ? 'Pending'
                            : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getBotGoal(bot.type, bot.config)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {completedSteps === totalSteps && totalSteps > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              All pack objectives completed!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PackBots({ project }: PackBotsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogStates, setDialogStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [packStatus, setPackStatus] = useState<'active' | 'inactive'>(
    'inactive'
  );
  const [_distributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [postOperationDialogOpen, setPostOperationDialogOpen] = useState(false);
  const [
    distributionPostOperationDialogOpen,
    setDistributionPostOperationDialogOpen,
  ] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState(0.001);
  const [isDistributing, setIsDistributing] = useState(false);
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);

  // Wallet balances state for all pack bots
  interface WalletBalances {
    [address: string]: {
      nativeBalance: number;
      tokenBalance: number;
      totalSnipeTokenBalance?: number; // Total token balance across all snipe wallets
    };
  }
  const [depositWalletBalances, setDepositWalletBalances] =
    useState<WalletBalances>({});
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Pack bots state - similar to addOns in project-add-ons
  const [packBots, setPackBots] = useState<PackBotType[]>(initialPackBots);

  // Manual Token Swap and LP Management dialogs
  const [isManualSwapDialogOpen, setIsManualSwapDialogOpen] = useState(false);
  const [isManualLPDialogOpen, setIsManualLPDialogOpen] = useState(false);
  const [isWalletManagementModalOpen, setIsWalletManagementModalOpen] =
    useState(false);
  const [isDistributionBotDialogOpen, setIsDistributionBotDialogOpen] =
    useState(false);
  const [isTrendingBotDialogOpen, setIsTrendingBotDialogOpen] = useState(false);
  const [isAutoSellBotDialogOpen, setIsAutoSellBotDialogOpen] = useState(false);
  const [isTrendingBotBuyFillDialogOpen, setIsTrendingBotBuyFillDialogOpen] =
    useState(false);
  const [trendingBotBuyAmount, setTrendingBotBuyAmount] = useState('');
  const [isExecutingTrendingBotBuy, setIsExecutingTrendingBotBuy] =
    useState(false);

  // Individual bot configurations for enable/disable functionality
  const [individualBotConfigs, setIndividualBotConfigs] = useState<{
    [key: string]: {
      _id?: string;
      enabled: boolean;
    };
  }>({
    autoSellBot: { enabled: false },
    trendingBot: { enabled: false },
  });

  // Add configs state similar to project-add-ons for tracking bot states
  const [configs, setConfigs] = useState<{
    [key: string]: {
      enabled: boolean;
    };
  }>({
    AutoSellBot: { enabled: false },
    TrendingBot: { enabled: false },
    DistributionBot: { enabled: false },
    VolumeBot: { enabled: false },
    HolderBot: { enabled: false },
    SnipeBot: { enabled: false },
  });
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [isInitialBalanceLoading, setIsInitialBalanceLoading] = useState(true);
  const currentProjectIdRef = useRef(project?._id);

  // Update individual bot configs when project data changes
  useEffect(() => {
    if (project?.addons) {
      setIndividualBotConfigs({
        autoSellBot: {
          _id: project.addons.AutoSellBot?._id,
          // Consider bot enabled if explicitly enabled OR if it has active wallets
          enabled:
            project.addons.AutoSellBot?.isEnabled ||
            (project.addons.AutoSellBot?.countsOfActivaveWallets &&
              project.addons.AutoSellBot?.countsOfActivaveWallets > 0) ||
            false,
        },
        trendingBot: {
          _id: project.addons.TrendingBot?._id,
          // Consider bot enabled if explicitly enabled OR if it has generated volume/activity
          enabled:
            project.addons.TrendingBot?.isEnabled ||
            (project.addons.TrendingBot?.generatedVolume &&
              project.addons.TrendingBot?.generatedVolume > 0) ||
            false,
        },
      });

      // Initialize configs state with current project addon states
      setConfigs({
        AutoSellBot: {
          enabled: project.addons.AutoSellBot?.isEnabled || false,
        },
        TrendingBot: {
          enabled: project.addons.TrendingBot?.isEnabled || false,
        },
        DistributionBot: {
          enabled: project.addons.DistributionBot?.isEnabled || false,
        },
        VolumeBot: { enabled: project.addons.VolumeBot?.isEnabled || false },
        HolderBot: { enabled: project.addons.HolderBot?.isEnabled || false },
        SnipeBot: { enabled: project.addons.SnipeBot?.isEnabled || false },
      });
    }
  }, [project?.addons]);

  // Individual bot toggle handler
  // const handleIndividualBotToggle = async (botType: string) => {
  //   const currentEnabled = individualBotConfigs[botType]?.enabled;
  //   const botId = individualBotConfigs[botType]?._id;

  //   if (!project?._id || !botId) {
  //     toast({
  //       title: 'Error',
  //       description: 'Bot ID is missing. Cannot toggle bot.',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   if (botType === 'AutoSellBot' && !currentEnabled) {
  //     setIsAutoSellBotDialogOpen(true);
  //     return;
  //   }

  //   if (botType === 'TrendingBot' && !currentEnabled) {
  //     setIsTrendingBotDialogOpen(true);
  //     return;
  //   }

  //   // Update local state optimistically
  //   setIndividualBotConfigs((prev) => ({
  //     ...prev,
  //     [botType]: { ...prev[botType], enabled: !currentEnabled },
  //   }));

  //   // Dispatch the toggle action to the Redux store
  //   try {
  //     await dispatch(
  //       toggleBot({
  //         projectId: project._id,
  //         botId: botId,
  //         enabled: !currentEnabled,
  //       })
  //     ).unwrap();

  //     toast({
  //       title: `Bot ${!currentEnabled ? 'Enabled' : 'Disabled'}`,
  //       description: `${botType === 'AutoSellBot' ? 'Auto Sell Bot' : 'Trending Bot'} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
  //     });
  //   } catch (error: any) {
  //     // Revert the optimistic update on error
  //     setIndividualBotConfigs((prev) => ({
  //       ...prev,
  //       [botType]: { ...prev[botType], enabled: currentEnabled },
  //     }));

  //     toast({
  //       title: error.response?.data?.errorType || 'Error',
  //       description:
  //         error.response?.data?.errorMessage?.toString().slice(0, 200) ||
  //         'Failed to toggle bot. Please try again.',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  // Function to handle successful bot configuration
  const handleBotConfigurationSuccess = (botType: string) => {
    // Update configs state to enable the bot switch
    setConfigs((prev) => ({
      ...prev,
      [botType]: {
        ...prev[botType],
        enabled: true,
      },
    }));

    // Update packBots state to reflect the enabled status
    setPackBots((prevPackBots) =>
      prevPackBots.map((bot) =>
        bot.type === botType ? { ...bot, enabled: true } : bot
      )
    );

    // Close the dialog
    if (botType === 'AutoSellBot') {
      setIsAutoSellBotDialogOpen(false);
    } else if (botType === 'TrendingBot') {
      setIsTrendingBotDialogOpen(false);
    } else if (botType === 'DistributionBot') {
      setIsDistributionBotDialogOpen(false);
    }

    // Refresh project data and wallet balances
    dispatch(fetchPackById(project._id) as any);
    refreshPackWalletBalances();
  };

  const handleToggle = async (botType: string) => {
    // Find the bot in packBots array
    const bot = packBots.find((b) => b.type === botType);
    if (!project?._id || !bot?._id) {
      toast({
        title: 'Error',
        description: 'Bot ID or Project ID is missing. Cannot toggle bot.',
        variant: 'destructive',
      });
      return;
    }

    // Get the current enabled state
    const currentEnabled = bot.enabled || false;

    // Update local state optimistically first
    setPackBots((prevPackBots) =>
      prevPackBots.map((b) =>
        b.type === botType ? { ...b, enabled: !currentEnabled } : b
      )
    );

    // Dispatch the toggle action to the Redux store
    dispatch(
      toggleBot({
        projectId: project._id,
        botId: bot._id,
        enabled: !currentEnabled,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: `Bot ${!currentEnabled ? 'Enabled' : 'Disabled'}`,
          description: `${botType} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
        });
      })
      .catch((error) => {
        // Revert the optimistic update on error
        setPackBots((prevPackBots) =>
          prevPackBots.map((b) =>
            b.type === botType ? { ...b, enabled: currentEnabled } : b
          )
        );

        toast({
          title: error.response?.data?.errorType || 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to toggle bot. Please try again.',
          variant: 'destructive',
        });
      });
  };

  // Failsafe: Clear loading state after 10 seconds regardless
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitialBalanceLoading) {
        console.log(
          '[pack-bots] Failsafe: Clearing loading state after timeout'
        );
        setIsInitialBalanceLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isInitialBalanceLoading]);

  // Post-operation modal state
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isCollectingNative, setIsCollectingNative] = useState(false);
  const [isExecutingMultiSell, setIsExecutingMultiSell] = useState(false);
  const [isExecutingMultiBuy, setIsExecutingMultiBuy] = useState(false);
  const [executingSingleSells, setExecutingSingleSells] = useState<{
    [key: string]: boolean;
  }>({});
  const [executingSingleBuys, setExecutingSingleBuys] = useState<{
    [key: string]: boolean;
  }>({});
  const [extraDistributeNativeAmount, setExtraDistributeNativeAmount] =
    useState<number>(0.001);

  // Socket connection state
  const [currentExecutingBot, setCurrentExecutingBot] = useState<string | null>(
    null
  );
  const [botCompletionStates, setBotCompletionStates] = useState<{
    [key: string]: boolean;
  }>({});

  const { toast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const isProjectOwner = useSelector((state: RootState) => {
    const userId = state.auth.user?._id;
    const owner = project?.owner;

    if (!userId || !owner) return false;

    // Handle owner as string (owner ID)
    if (typeof owner === 'string') {
      return userId === owner;
    }

    // Handle owner as object
    return userId === owner._id;
  });

  console.log('[pack-bots] project', project);

  const packConfig = (project as any)?.packConfig;

  // Initialize pack status and bot completion states from project prop
  useEffect(() => {
    const initialStatus =
      (project as any)?.isRunning === true ? 'active' : 'inactive';
    setPackStatus(initialStatus);
    setCurrentExecutingBot((project as any)?.currentExecutingBot || null);

    // Initialize bot completion states from packConfig
    if (packConfig) {
      setBotCompletionStates({
        SnipeBot: packConfig.snipeBotConfig?.achieved || false,
        DistributionBot: packConfig.distributionBotConfig?.achieved || false,
        VolumeBot: packConfig.volumeBotConfig?.achieved || false,
        HolderBot: packConfig.holderBotConfig?.achieved || false,
        AutoSellBot: packConfig.autoSellBotConfig?.achieved || false,
        TrendingBot: packConfig.trendingBotConfig?.achieved || false,
      });
    }
  }, [project, packConfig]);

  // Utility function for parsing error messages
  const parseErrorMessage = (
    message: string,
    details: string,
    nativeCurrency: string
  ) => {
    if (message.includes('insufficient funds')) {
      const addressMatch = details.match(/address (\w+)/);
      const availableMatch = details.match(/have (\d+)/);
      const requiredMatch = details.match(/want (\d+)/);

      const address = addressMatch ? addressMatch[1] : 'unknown';
      const available = availableMatch
        ? parseInt(availableMatch[1], 10) / 1e18
        : 0;
      const required = requiredMatch
        ? parseInt(requiredMatch[1], 10) / 1e18
        : 0;
      const additionalNeeded = required - available;

      return {
        title: 'Insufficient Funds',
        message: `Your wallet ${address} has insufficient funds. Available: ${available.toFixed(6)} ${nativeCurrency}, Required: ${required.toFixed(6)} ${nativeCurrency}. Please add at least ${additionalNeeded.toFixed(6)} ${nativeCurrency} to proceed.`,
      };
    }

    // Add more error parsing cases here as needed
    return { title: 'Error', message };
  };

  // WebSocket event handlers
  const handlePackBotCompleted = useCallback(
    (data: any) => {
      console.log('[pack-bots] Bot completed:', data);

      if (data.packId === project?._id) {
        // Update bot completion state
        setBotCompletionStates((prev) => ({
          ...prev,
          [data.botType]: true,
        }));

        // Show success notification
        toast({
          title: 'Bot Completed!',
          description: `${data.botType} has completed its objectives successfully.`,
        });

        // Refresh project data to get updated pack config
        dispatch(fetchPackById(project._id) as any);
        refreshPackWalletBalances();
      }
    },
    [project?._id, toast, dispatch]
  );

  const handlePackBotFailed = useCallback(
    (data: any) => {
      console.log('[pack-bots] Bot failed:', data);

      if (data.packId === project?._id) {
        // Show error notification
        toast({
          title: 'Bot Failed',
          description: `${data.botType} failed: ${data.error}`,
          variant: 'destructive',
        });

        // Update pack status to inactive
        setPackStatus('inactive');
        setCurrentExecutingBot(null);

        // Refresh project data
        dispatch(fetchPackById(project._id) as any);
        refreshPackWalletBalances();
      }
    },
    [project?._id, toast, dispatch]
  );

  const handlePackStatusUpdated = useCallback(
    (data: any) => {
      console.log('[pack-bots] Pack status updated:', data);

      if (data.packId === project?._id) {
        // Update pack status and current executing bot
        if (data.status === 'active') {
          setPackStatus('active');
          setCurrentExecutingBot(data.currentBot || null);
        } else if (data.status === 'inactive') {
          setPackStatus('inactive');
          setCurrentExecutingBot(null);
        } else if (data.status === 'completed') {
          setPackStatus('inactive');
          setCurrentExecutingBot(null);

          // Show completion notification
          toast({
            title: 'Pack Completed!',
            description:
              'All bots in the pack have completed their objectives successfully.',
          });
        } else if (data.status === 'failed') {
          setPackStatus('inactive');
          setCurrentExecutingBot(null);

          // Show failure notification
          toast({
            title: 'Pack Failed',
            description: 'Pack execution has failed and been stopped.',
            variant: 'destructive',
          });
        }

        // Refresh project data
        dispatch(fetchPackById(project._id) as any);
        refreshPackWalletBalances();
      }
    },
    [project?._id, toast, dispatch]
  );

  const handleVolumeGenerationUpdate = (data: {
    botId: string;
    generatedVolume: number;
    error?: {
      type: string;
      message: string;
      details: string;
      projectId?: string;
      volumeBotId?: string;
    };
  }) => {
    console.log('Received volume generation update:', data);
    if (data.error) {
      console.error('Volume generation error:', data.error);
      console.log('======== project?.chainName : ', project?.chainName);
      console.log('======== project object : ', project);
      const nativeCurrency =
        project?.chainName === 'BSC_MAINNET'
          ? 'BNB'
          : project?.chainName === 'ETH_MAINNET'
            ? 'ETH'
            : 'SOL';
      const { title, message } = parseErrorMessage(
        data.error.message,
        data.error.details,
        nativeCurrency
      );
      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      console.log('Volume generated successfully:', data.generatedVolume);
      if (data.generatedVolume > 0) {
        toast({
          title: 'Volume Generated',
          description: `Successfully generated ${data.generatedVolume.toFixed(2)} volume`,
          variant: 'default',
        });
      }

      // Update the generated volume in packBots state (accumulate, don't replace)
      setPackBots((prevPackBots) =>
        prevPackBots.map((bot) =>
          bot.type === 'VolumeBot'
            ? {
                ...bot,
                generatedVolume:
                  (bot.generatedVolume || 0) + data.generatedVolume,
              }
            : bot
        )
      );
    }
    // Refresh wallet balances after volume generation update
    refreshPackWalletBalances();
  };

  const handleHolderGenerationUpdate = (data: {
    botId: string;
    generatedHolders: number;
    error?: {
      type: string;
      message: string;
      details: string;
      projectId?: string;
      botId?: string;
    };
  }) => {
    console.log('Received holder generation update:', data);
    if (data.error) {
      console.error('Holder generation error:', data.error);
      console.log('======== project? : ', project);
      const nativeCurrency =
        project?.chainName === 'BSC_MAINNET'
          ? 'BNB'
          : project?.chainName === 'ETH_MAINNET'
            ? 'ETH'
            : 'SOL';
      const { title, message } = parseErrorMessage(
        data.error.message,
        data.error.details,
        nativeCurrency
      );

      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      console.log('Holders generated successfully:', data.generatedHolders);
      if (data.generatedHolders > 0) {
        toast({
          title: 'Holders Generated',
          description: `Successfully generated ${data.generatedHolders} holders`,
          variant: 'default',
        });

        // Update the holder count in packBots state
        setPackBots((prevPackBots) =>
          prevPackBots.map((bot) =>
            bot.type === 'HolderBot'
              ? { ...bot, generatedHolders: data.generatedHolders }
              : bot
          )
        );
      }
    }
    // Refresh wallet balances after holder generation update
    refreshPackWalletBalances();
  };

  // Handle trending bot updates
  const handleTrendingBotUpdate = async (data: {
    botId: string;
    generatedVolume: number;
    generatedTrending: string;
    error?: {
      type: string;
      message: string;
      details: string;
      projectId?: string;
      trendingBotId?: string;
    };
  }) => {
    console.log('Received trending bot update:', data);
    if (data.error) {
      console.error('Trending bot error:', data.error);
      const nativeCurrency =
        project?.chainName === 'BSC_MAINNET'
          ? 'BNB'
          : project?.chainName === 'ETH_MAINNET'
            ? 'ETH'
            : 'SOL';
      const { title, message } = parseErrorMessage(
        data.error.message,
        data.error.details,
        nativeCurrency
      );
      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      console.log(
        'Trending volume generated successfully:',
        data.generatedVolume
      );
      if (data.generatedVolume > 0) {
        toast({
          title: 'Trending Volume Generated',
          description: `Successfully generated ${data.generatedVolume.toFixed(2)} trending volume for ${data.generatedTrending}`,
          variant: 'default',
        });

        // Fetch latest project data to get updated trending bot information
        try {
          console.log(
            'Fetching updated project data for pack trending bot metrics'
          );
          const resultAction = await dispatch(fetchPackById(project._id));

          if (fetchPackById.fulfilled.match(resultAction)) {
            const updatedProject = resultAction.payload;
            console.log('Fetched updated pack project data:', updatedProject);

            // Extract trending bot data from the project
            const trendingBot = updatedProject?.addons?.TrendingBot;
            if (trendingBot) {
              console.log('Extracted pack trending bot data:', trendingBot);

              // Update the trending bot in packBots state with latest data from project
              setPackBots((prevPackBots) =>
                prevPackBots.map((bot) =>
                  bot.type === 'TrendingBot'
                    ? {
                        ...bot,
                        generatedVolume: trendingBot.generatedVolume || 0,
                        trend: data.generatedTrending as 'upward' | 'downward',
                        elapsedMinutes: trendingBot.elapsedMinutes,
                        targetMinutes: trendingBot.targetMinutes,
                        countsOfActiveWallets:
                          trendingBot.subWalletIds?.length || 0,
                        totalTokenBalance: trendingBot.tokenBalance || 0,
                        nativeBalance: trendingBot.nativeBalance || 0,
                      }
                    : bot
                )
              );

              // Log detailed metrics for debugging
              console.log(
                'Pack trending bot metrics updated from project data:',
                {
                  botId: trendingBot._id,
                  generatedVolume: trendingBot.generatedVolume,
                  trend: data.generatedTrending,
                  elapsedMinutes: trendingBot.elapsedMinutes,
                  targetMinutes: trendingBot.targetMinutes,
                  walletCount: trendingBot.subWalletIds?.length || 0,
                  nativeBalance: trendingBot.nativeBalance,
                  tokenBalance: trendingBot.tokenBalance,
                }
              );
            } else {
              console.warn(
                'No trending bot found in pack project data, using basic update'
              );
              // Fallback to basic update if no trending bot in project
              setPackBots((prevPackBots) =>
                prevPackBots.map((bot) =>
                  bot.type === 'TrendingBot'
                    ? {
                        ...bot,
                        generatedVolume:
                          (bot.generatedVolume || 0) + data.generatedVolume,
                        trend: data.generatedTrending as 'upward' | 'downward',
                      }
                    : bot
                )
              );
            }
          } else {
            console.warn(
              'Failed to fetch pack project data, using basic update'
            );
            // Fallback to basic update if project fetch fails
            setPackBots((prevPackBots) =>
              prevPackBots.map((bot) =>
                bot.type === 'TrendingBot'
                  ? {
                      ...bot,
                      generatedVolume:
                        (bot.generatedVolume || 0) + data.generatedVolume,
                      trend: data.generatedTrending as 'upward' | 'downward',
                    }
                  : bot
              )
            );
          }
        } catch (error) {
          console.error(
            'Error fetching pack project data for trending bot metrics:',
            error
          );
          // Fallback to basic update if project fetch fails
          setPackBots((prevPackBots) =>
            prevPackBots.map((bot) =>
              bot.type === 'TrendingBot'
                ? {
                    ...bot,
                    generatedVolume:
                      (bot.generatedVolume || 0) + data.generatedVolume,
                    trend: data.generatedTrending as 'upward' | 'downward',
                  }
                : bot
            )
          );
        }
      }
    }
    // Refresh wallet balances after trending bot update
    refreshPackWalletBalances();
  };

  // Handle auto sell bot activity updates
  const handleAutoSellActivity = (data: any) => {
    console.log('⭐ [pack-bots] Received ACTIVITY_LOG_ADDED event:', {
      event: WebSocketEvents.ACTIVITY_LOG_ADDED,
      timestamp: new Date().toISOString(),
      projectId: data?.projectId,
      expectedProjectId: project?._id,
      hasActivity: !!data?.activity,
      activityType: data?.activity?.type,
      botType: data?.activity?.botType,
      action: data?.activity?.action,
    });

    if (!data) {
      console.warn(
        '❌ [pack-bots] No data received in ACTIVITY_LOG_ADDED event'
      );
      return;
    }

    if (data.projectId !== project?._id) {
      console.warn(
        `❌ [pack-bots] Project ID mismatch in ACTIVITY_LOG_ADDED event: received ${data.projectId}, expected ${project?._id}`
      );
      return;
    }

    if (!data.activity) {
      console.warn(
        '❌ [pack-bots] No activity data in ACTIVITY_LOG_ADDED event'
      );
      return;
    }

    if (data.activity.botType !== 'AutoSell') {
      console.warn(
        `❌ [pack-bots] Not an AutoSellBot in ACTIVITY_LOG_ADDED event: ${data.activity.botType}`
      );
      return;
    }

    console.log('✅ [pack-bots] Valid AutoSellBot activity detected:', {
      event: WebSocketEvents.ACTIVITY_LOG_ADDED,
      timestamp: new Date().toISOString(),
      projectId: data.projectId,
      activityTimestamp: data.activity.timestamp,
      description: data.activity.description,
      action: data.activity.action,
      botType: data.activity.botType,
    });

    // Show notification for auto sell activity
    toast({
      title: 'Auto Sell Bot Activity',
      description:
        data.activity.description || `${data.activity.action}: Tokens sold`,
      variant: 'default',
    });

    // Update auto sell bot status/metrics in packBots state if needed
    setPackBots((prevPackBots) =>
      prevPackBots.map((bot) =>
        bot.type === 'AutoSellBot'
          ? {
              ...bot,
              // Update any relevant metrics here based on the activity
              lastActivity: data.activity.timestamp,
            }
          : bot
      )
    );

    // Refresh wallet balances after auto sell activity
    refreshPackWalletBalances();
  };

  // Initialize websocket connection and event listeners
  useEffect(() => {
    if (!project?._id) return;

    // Ensure connection and join project room
    websocketService.connect();
    websocketService.joinProject(project._id);

    // Subscribe to pack orchestration events
    websocketService.subscribe(
      WebSocketEvents.PACK_BOT_COMPLETED,
      handlePackBotCompleted
    );
    websocketService.subscribe(
      WebSocketEvents.PACK_BOT_FAILED,
      handlePackBotFailed
    );
    websocketService.subscribe(
      WebSocketEvents.PACK_STATUS_UPDATED,
      handlePackStatusUpdated
    );

    websocketService.subscribe(
      WebSocketEvents.VOLUME_GENERATION_UPDATED,
      handleVolumeGenerationUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.HOLDER_GENERATION_UPDATED,
      handleHolderGenerationUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.TRENDING_GENERATION_UPDATED,
      handleTrendingBotUpdate
    );
    websocketService.subscribe(
      WebSocketEvents.ACTIVITY_LOG_ADDED,
      handleAutoSellActivity
    );

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe(
        WebSocketEvents.PACK_BOT_COMPLETED,
        handlePackBotCompleted
      );
      websocketService.unsubscribe(
        WebSocketEvents.PACK_BOT_FAILED,
        handlePackBotFailed
      );
      websocketService.unsubscribe(
        WebSocketEvents.PACK_STATUS_UPDATED,
        handlePackStatusUpdated
      );
      websocketService.unsubscribe(
        WebSocketEvents.VOLUME_GENERATION_UPDATED,
        handleVolumeGenerationUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.HOLDER_GENERATION_UPDATED,
        handleHolderGenerationUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.TRENDING_GENERATION_UPDATED,
        handleTrendingBotUpdate
      );
      websocketService.unsubscribe(
        WebSocketEvents.ACTIVITY_LOG_ADDED,
        handleAutoSellActivity
      );
      websocketService.leaveProject(project._id);
    };
  }, [
    project?._id,
    handlePackBotCompleted,
    handlePackBotFailed,
    handlePackStatusUpdated,
    handleVolumeGenerationUpdate,
    handleHolderGenerationUpdate,
    handleTrendingBotUpdate,
    handleAutoSellActivity,
  ]);

  const packEnabled = packStatus === 'active';

  // Get native currency symbol
  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

  // Wallet selection helpers
  const isAllWalletsSelected = wallets
    .filter((w) => w.role !== 'botmain')
    .every((w) => w.isSelectedForMutilSell);
  const isSomeWalletsSelected = wallets
    .filter((w) => w.role !== 'botmain')
    .some((w) => w.isSelectedForMutilSell);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard',
    });
  };

  // Toggle dialog state
  const toggleDialog = (botType: string, isOpen: boolean) => {
    setDialogStates((prev) => ({
      ...prev,
      [botType]: isOpen,
    }));
  };

  // Fetch wallets for post-operation modal
  const fetchWallets = async () => {
    const snipeBotAddon = (project as any)?.addons?.SnipeBot;
    if (!snipeBotAddon) return [];

    const depositWallet = snipeBotAddon.depositWalletId;
    const subWallets = snipeBotAddon.subWalletIds;

    const newWallets: WalletInfo[] = [];

    // Add deposit wallet if it exists
    if (depositWallet) {
      newWallets.push({
        _id: depositWallet._id,
        publicKey: depositWallet.publicKey,
        role: 'botmain',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
      });
    }

    // Add sub wallets
    subWallets?.forEach((wallet: any) => {
      newWallets.push({
        _id: wallet._id,
        publicKey: wallet.publicKey,
        role: wallet.role || 'botsub',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
        nativeSpendRate: 90, // Default to 90% native spend rate
      });
    });

    return newWallets;
  };

  // Fetch distribution bot wallets for post-operation modal
  const fetchDistributionWallets = async () => {
    const distributionBotAddon = (project as any)?.addons?.DistributionBot;
    if (!distributionBotAddon) return [];

    const depositWallet = distributionBotAddon.depositWalletId;
    const subWallets = distributionBotAddon.subWalletIds;

    const newWallets: WalletInfo[] = [];

    // Add deposit wallet if it exists
    if (depositWallet) {
      newWallets.push({
        _id: depositWallet._id,
        publicKey: depositWallet.publicKey,
        role: 'botmain',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
      });
    }

    // Add sub wallets
    subWallets?.forEach((wallet: any) => {
      newWallets.push({
        _id: wallet._id,
        publicKey: wallet.publicKey,
        role: wallet.role || 'botsub',
        sellPercentage: 100,
        isSelectedForMutilSell: false,
        nativeSpendRate: 90, // Default to 90% native spend rate
      });
    });

    return newWallets;
  };

  // Fetch wallet balances
  const fetchBalances = async (addresses: string[]) => {
    if (!project?.tokenAddress || !addresses.length) return;

    try {
      setIsLoadingBalances(true);

      const balancesArray = await getWalletBalances(
        addresses,
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );

      // Update wallets with fetched balances
      setWallets((prevWallets) =>
        prevWallets.map((wallet) => {
          const balance = balancesArray.find(
            (b) => b.address === wallet.publicKey
          );
          return {
            ...wallet,
            nativeBalance: balance ? Number(balance.nativeBalance) : 0,
            tokenBalance: balance ? Number(balance.tokenBalance) : 0,
          };
        })
      );

      // Also update deposit wallet balance
      const depositBalance = balancesArray.find(
        (b) =>
          b.address ===
          (project as any)?.addons?.SnipeBot?.depositWalletId?.publicKey
      );
      if (depositBalance) {
        setDepositWalletBalance(Number(depositBalance.nativeBalance));
      }
    } catch (error: any) {
      console.error('Error fetching wallet balances:', error);
      toast({
        title: 'Balance Fetch Error',
        description: 'Failed to fetch wallet balances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Handle select all wallets
  const handleSelectAllWallets = (checked: boolean) => {
    setWallets((prevWallets) =>
      prevWallets.map((wallet) => ({
        ...wallet,
        isSelectedForMutilSell: wallet.role !== 'botmain' ? checked : false,
      }))
    );
  };

  // Handle post-operation modal open
  const handlePostOperationDialogOpen = async () => {
    setPostOperationDialogOpen(true);

    // Fetch wallets and their balances
    const fetchedWallets = await fetchWallets();
    setWallets(fetchedWallets);

    if (fetchedWallets.length > 0) {
      const addresses = fetchedWallets.map((w) => w.publicKey);
      await fetchBalances(addresses);
    }
  };

  // Handle distribution post-operation modal open
  const handleDistributionPostOperationDialogOpen = async () => {
    setDistributionPostOperationDialogOpen(true);

    // Fetch distribution bot wallets and their balances
    const fetchedWallets = await fetchDistributionWallets();
    setWallets(fetchedWallets);

    if (fetchedWallets.length > 0) {
      const addresses = fetchedWallets.map((w) => w.publicKey);
      await fetchBalances(addresses);
    }
  };

  // Handle distribute extra native
  const handleDistributeExtraNative = async () => {
    if (!project?._id || extraDistributeNativeAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid distribution amount.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDistributing(true);

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const depositWallet = snipeBotAddon.depositWalletId?.publicKey;
      const subWallets =
        snipeBotAddon.subWalletIds?.map((w: any) => w.publicKey) || [];
      const amounts = subWallets.map(() => extraDistributeNativeAmount);

      const result = await BotService.distributeNative({
        depositWallet,
        subWallets,
        amounts,
        projectId: project._id,
        botId: snipeBotAddon._id,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success.success) {
        toast({
          title: 'Distribution Successful',
          description: `Distributed ${extraDistributeNativeAmount} ${nativeCurrency} to sub-wallets`,
        });

        // Refresh balances after distribution
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.success.error || 'Distribution failed');
      }
    } catch (error: any) {
      console.error('Error distributing native:', error);
      toast({
        title: 'Distribution Failed',
        description: error.message || 'Failed to distribute native currency',
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Handle collect native
  const handleCollectNative = async () => {
    if (!project?._id) return;

    try {
      setIsCollectingNative(true);

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const subWallets =
        snipeBotAddon.subWalletIds?.map((w: any) => w.publicKey) || [];
      const targetWallet = snipeBotAddon.depositWalletId?.publicKey;

      const result = await BotService.collectNative({
        botId: snipeBotAddon._id,
        walletAddresses: subWallets,
        targetWallet,
        projectId: project._id,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Collection Successful',
          description: `Collected ${nativeCurrency} from sub-wallets`,
        });

        // Refresh balances after collection
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.error || 'Collection failed');
      }
    } catch (error: any) {
      console.error('Error collecting native:', error);
      toast({
        title: 'Collection Failed',
        description: error.message || 'Failed to collect native currency',
        variant: 'destructive',
      });
    } finally {
      setIsCollectingNative(false);
    }
  };

  // Handle single sell
  const handleSingleSell = async (
    walletAddress: string,
    sellPercentage: number
  ) => {
    if (!project?._id) return;

    try {
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: true }));

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const result = await BotService.singleWalletSell({
        projectId: project._id,
        botId: snipeBotAddon._id,
        walletAddress,
        tokenAddress: project.tokenAddress,
        sellPercentage,
        slippageTolerance: 10, // Default 10% slippage
        targetWalletAddress: snipeBotAddon.depositWalletId?.publicKey,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Sell Successful',
          description: `Sold ${sellPercentage}% of tokens from wallet`,
        });

        // Refresh balances after sell
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.error || 'Sell failed');
      }
    } catch (error: any) {
      console.error('Error selling tokens:', error);
      toast({
        title: 'Sell Failed',
        description: error.message || 'Failed to sell tokens',
        variant: 'destructive',
      });
    } finally {
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  // Handle single buy
  const handleSingleBuy = async (walletAddress: string) => {
    if (!project?._id) return;

    try {
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: true }));

      const wallet = wallets.find((w) => w.publicKey === walletAddress);
      const spendRate = wallet?.nativeSpendRate || 90;

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const result = await BotService.singleWalletBuy({
        projectId: project._id,
        botId: snipeBotAddon._id,
        walletAddress,
        tokenAddress: project.tokenAddress,
        slippageTolerance: 10, // Default 10% slippage
        nativeSpendRate: spendRate,
        targetWalletAddress: snipeBotAddon.depositWalletId?.publicKey,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Buy Successful',
          description: `Bought tokens with ${spendRate}% of wallet balance`,
        });

        // Refresh balances after buy
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.error || 'Buy failed');
      }
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      toast({
        title: 'Buy Failed',
        description: error.message || 'Failed to buy tokens',
        variant: 'destructive',
      });
    } finally {
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  // Handle multi sell
  const handleMultiSell = async () => {
    if (!project?._id) return;

    const selectedWallets = wallets.filter((w) => w.isSelectedForMutilSell);
    if (selectedWallets.length === 0) {
      toast({
        title: 'No Wallets Selected',
        description: 'Please select at least one wallet for multi-sell.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExecutingMultiSell(true);

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const result = await BotService.multiWalletSell({
        projectId: project._id,
        botId: snipeBotAddon._id,
        walletAddresses: selectedWallets
          .filter((w) => w.role === 'botsub_target')
          .map((w) => w.publicKey),
        tokenAddress: project.tokenAddress,
        sellPercentages: selectedWallets.map((w) => w.sellPercentage || 100),
        slippageTolerance: 10, // Default 10% slippage
        targetWalletAddress: snipeBotAddon.depositWalletId?.publicKey,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Multi-Sell Successful',
          description: `Sold tokens from ${selectedWallets.length} wallets`,
        });

        // Refresh balances after multi-sell
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.error || 'Multi-sell failed');
      }
    } catch (error: any) {
      console.error('Error multi-selling tokens:', error);
      toast({
        title: 'Multi-Sell Failed',
        description:
          error.message || 'Failed to sell tokens from multiple wallets',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiSell(false);
    }
  };

  // Handle multi buy
  const handleMultiBuy = async () => {
    if (!project?._id) return;

    const selectedWallets = wallets.filter((w) => w.isSelectedForMutilSell);
    if (selectedWallets.length === 0) {
      toast({
        title: 'No Wallets Selected',
        description: 'Please select at least one wallet for multi-buy.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExecutingMultiBuy(true);

      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon) {
        throw new Error('SnipeBot addon not found');
      }

      const result = await BotService.multiWalletBuy({
        projectId: project._id,
        botId: snipeBotAddon._id,
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project.tokenAddress,
        slippageTolerance: 10, // Default 10% slippage
        nativeSpendRates: selectedWallets.map((w) => w.nativeSpendRate || 90),
        targetWalletAddress: snipeBotAddon.depositWalletId?.publicKey,
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Multi-Buy Successful',
          description: `Bought tokens with ${selectedWallets.length} wallets`,
        });

        // Refresh balances after multi-buy
        const addresses = wallets.map((w) => w.publicKey);
        await fetchBalances(addresses);
      } else {
        throw new Error(result.error || 'Multi-buy failed');
      }
    } catch (error: any) {
      console.error('Error multi-buying tokens:', error);
      toast({
        title: 'Multi-Buy Failed',
        description:
          error.message || 'Failed to buy tokens with multiple wallets',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiBuy(false);
    }
  };

  // Fetch deposit wallet balance
  const fetchDepositWalletBalance = async () => {
    const depositWalletAddress = (project as any)?.addons?.SnipeBot
      ?.depositWalletId?.publicKey;

    if (!depositWalletAddress || isLoadingBalance) return;

    try {
      setIsLoadingBalance(true);

      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import('ethers');

      const rpcUrl =
        project?.chainName === 'BSC_MAINNET'
          ? process.env.NEXT_PUBLIC_BSC_RPC_URL
          : process.env.NEXT_PUBLIC_ETH_RPC_URL;

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Get balance in Wei
      const balanceWei = await provider.getBalance(depositWalletAddress);

      // Convert to native currency (ETH/BNB)
      const balance = parseFloat(ethers.formatEther(balanceWei));

      setDepositWalletBalance(balance);
    } catch (error: any) {
      console.error('Error fetching deposit wallet balance:', error);
      toast({
        title: 'Balance Fetch Error',
        description:
          'Failed to fetch deposit wallet balance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle distribute dialog open
  const _handleDistributeDialogOpen = () => {
    setDistributeDialogOpen(true);
    // Fetch current balance when dialog opens
    fetchDepositWalletBalance();
  };

  // Handle trending bot buy/fill tokens
  const handleTrendingBotBuyFill = async () => {
    if (
      !project?._id ||
      !trendingBotBuyAmount ||
      parseFloat(trendingBotBuyAmount) <= 0
    ) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to buy tokens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExecutingTrendingBotBuy(true);

      const trendingBotAddon = (project as any)?.addons?.TrendingBot;
      if (!trendingBotAddon?.depositWalletId?.publicKey) {
        toast({
          title: 'Error',
          description: 'Trending bot deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      // read native balance of deposit wallet
      const walletAddress = trendingBotAddon.depositWalletId.publicKey;
      const chainName = project.chainName || 'BSC_MAINNET';
      const nativeBalance = await getNativeBalance(walletAddress, chainName);

      // calculate percentage rate of trendingBotBuyAmount * 100 / native balance
      const buyAmountFloat = parseFloat(trendingBotBuyAmount);
      console.log('buyAmountFloat : ', buyAmountFloat);
      console.log('nativeBalance : ', nativeBalance);
      const nativeSpendRate = (buyAmountFloat * 100) / nativeBalance;
      console.log('nativeSpendRate : ', nativeSpendRate);

      // Validate that we have sufficient balance
      if (buyAmountFloat > nativeBalance) {
        toast({
          title: 'Insufficient Balance',
          description: `Wallet balance (${nativeBalance.toFixed(6)} ${nativeCurrency}) is insufficient for the requested purchase amount (${trendingBotBuyAmount} ${nativeCurrency})`,
          variant: 'destructive',
        });
        return;
      }

      const result = await BotService.singleWalletBuy({
        projectId: project._id,
        botId: trendingBotAddon._id,
        walletAddress: trendingBotAddon.depositWalletId.publicKey,
        tokenAddress: project.tokenAddress || '',
        slippageTolerance: 5, // 5% slippage tolerance
        nativeSpendRate: Math.ceil(nativeSpendRate), // calculated percentage rate
        chainName: project.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Purchase Successful',
          description: `Successfully bought ${project?.symbol || project.name} tokens with ${trendingBotBuyAmount} ${nativeCurrency}`,
        });

        // Refresh pack wallet balances
        refreshPackWalletBalances();

        // Close the modal and reset amount
        setIsTrendingBotBuyFillDialogOpen(false);
        setTrendingBotBuyAmount('');
      } else {
        throw new Error(result.error || 'Token purchase failed');
      }
    } catch (error: any) {
      console.error('Error buying tokens for trending bot:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to buy tokens',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingTrendingBotBuy(false);
    }
  };

  // Handle distribute native currency
  const _handleDistributeNative = async () => {
    if (distributeAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount to distribute',
        variant: 'destructive',
      });
      return;
    }

    try {
      const snipeBotAddon = (project as any)?.addons?.SnipeBot;
      if (!snipeBotAddon?.depositWalletId?.publicKey) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      // Get sub-wallet addresses
      const subWalletAddresses =
        snipeBotAddon.subWalletIds
          ?.filter((w: any) => w.role !== 'botmain' && w.publicKey)
          ?.map((w: any) => w.publicKey) || [];

      if (!subWalletAddresses.length) {
        toast({
          title: 'Error',
          description: 'No sub-wallets found for distribution',
          variant: 'destructive',
        });
        return;
      }

      setIsDistributing(true);

      // Calculate amounts for each wallet (even distribution)
      const amounts = subWalletAddresses.map(() => distributeAmount);

      const response = await BotService.distributeNative({
        depositWallet: snipeBotAddon.depositWalletId.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId: snipeBotAddon._id || '',
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (response?.success?.success) {
        toast({
          title: 'Success',
          description: `${nativeCurrency} distributed successfully to ${subWalletAddresses.length} wallets`,
        });
        setDistributeDialogOpen(false);
        setDistributeAmount(0.001);

        // Refresh balance after successful distribution
        setTimeout(() => {
          fetchDepositWalletBalance();
        }, 1000);
      } else {
        // Handle errors
        const errorMessage =
          response?.success?.error ||
          response?.message ||
          `Failed to distribute ${nativeCurrency}`;

        if (errorMessage.includes('Insufficient wallet balance')) {
          const match = errorMessage.match(
            /Required: ~([\d.]+) , Found: ([\d.]+) /
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `You need to deposit ${needed} ${nativeCurrency} to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error distributing native currency:', error);
      toast({
        title: error.response?.data?.errorType || 'Distribution Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          `Failed to distribute ${nativeCurrency}`,
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Update pack enabled status

  const handlePackToggle = useCallback(
    async (enabled: boolean) => {
      if (!isProjectOwner || !project?._id) return;

      setIsUpdating(true);
      try {
        const result = await BotService.updatePackEnabled({
          packId: project._id,
          enabled,
          chainName: project.chainName,
        });

        if (result.data?.project) {
          // Update local pack status immediately
          setPackStatus(enabled ? 'active' : 'inactive');

          toast({
            title: 'Success',
            description: `Pack ${enabled ? 'enabled' : 'disabled'} successfully`,
          });

          // Emit event to refresh sidebar data
          window.dispatchEvent(new CustomEvent('packsChanged'));
        } else {
          throw new Error('Failed to update pack status');
        }
      } catch (error: any) {
        console.error('Error updating pack status:', error);
        toast({
          title: error.response?.data?.errorType || 'Pack Enable Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to update pack status',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isProjectOwner, project?._id, project?.chainName, toast]
  );

  // Refresh balance function for all pack bot wallets
  const refreshPackWalletBalances = useCallback(async () => {
    if (!project?.tokenAddress || !project?.addons) {
      console.log('[pack-bots] Skipping balance fetch - missing project data');
      setIsInitialBalanceLoading(false);
      return;
    }

    const requestProjectId = project._id;
    console.log(
      '[pack-bots] Starting balance fetch for project:',
      requestProjectId
    );
    try {
      setIsRefreshingBalances(true);

      // Get all wallet addresses from all pack bots (including snipe sub-wallets)
      const allWalletAddresses: string[] = [];
      const walletToTypeMap: { [key: string]: string } = {};

      if (project.addons.SnipeBot?.depositWalletId?.publicKey) {
        const address = project.addons.SnipeBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'SnipeBot_deposit';

        // Add all snipe sub-wallets
        if (project.addons.SnipeBot.subWalletIds) {
          project.addons.SnipeBot.subWalletIds.forEach((wallet: any) => {
            if (wallet.publicKey) {
              allWalletAddresses.push(wallet.publicKey);
              walletToTypeMap[wallet.publicKey] = 'SnipeBot_snipe';
            }
          });
        }
      }

      if (project.addons.VolumeBot?.depositWalletId?.publicKey) {
        const address = project.addons.VolumeBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'VolumeBot';
      }

      if (project.addons.HolderBot?.depositWalletId?.publicKey) {
        const address = project.addons.HolderBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'HolderBot';
      }

      if (project.addons.AutoSellBot?.depositWalletId?.publicKey) {
        const address = project.addons.AutoSellBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'AutoSellBot';
      }

      if (project.addons.DistributionBot?.depositWalletId?.publicKey) {
        const address =
          project.addons.DistributionBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'DistributionBot';
      }

      // update of trending bot
      if (project.addons.TrendingBot?.depositWalletId?.publicKey) {
        const address = project.addons.TrendingBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'TrendingBot';
      }

      console.log(
        '[pack-bots] Refreshing balances for wallets:',
        allWalletAddresses
      );

      // Fetch balances for all wallets at once
      if (allWalletAddresses.length > 0) {
        const balancesArray = await getWalletBalances(
          allWalletAddresses,
          project.tokenAddress,
          project.chainName
        );

        console.log('[pack-bots] Balances array:', balancesArray);

        // Transform array into dictionary and calculate snipe bot total token balance
        const balances: WalletBalances = {};
        let snipeBotTotalTokenBalance = 0;

        balancesArray.forEach((balance) => {
          const walletType = walletToTypeMap[balance.address];

          balances[balance.address] = {
            nativeBalance: Number(balance.nativeBalance) || 0,
            tokenBalance: Number(balance.tokenBalance) || 0,
          };

          // Sum up token balances for all snipe wallets (excluding deposit wallet)
          if (walletType === 'SnipeBot_snipe') {
            snipeBotTotalTokenBalance += Number(balance.tokenBalance) || 0;
          }
        });

        // Add the total snipe token balance to the deposit wallet entry for easy access
        const snipeBotDepositAddress =
          project.addons.SnipeBot?.depositWalletId?.publicKey;
        if (snipeBotDepositAddress && balances[snipeBotDepositAddress]) {
          balances[snipeBotDepositAddress].totalSnipeTokenBalance =
            snipeBotTotalTokenBalance;
        }

        // Check if this response is still for the current project (race condition protection)
        if (currentProjectIdRef.current === requestProjectId) {
          setDepositWalletBalances(balances);

          // Update deposit wallet balance for backward compatibility (used in post-operations modal)
          const snipeBotBalance = balancesArray.find(
            (b) =>
              b.address === project.addons?.SnipeBot?.depositWalletId?.publicKey
          );
          if (snipeBotBalance) {
            setDepositWalletBalance(Number(snipeBotBalance.nativeBalance));
          }

          console.log(
            '[pack-bots] Balance fetch completed successfully for project:',
            requestProjectId
          );
        } else {
          console.log(
            '[pack-bots] Discarding stale balance response for project:',
            requestProjectId,
            'current project:',
            currentProjectIdRef.current
          );
        }

        // toast({
        //   title: 'Success',
        //   description: `Refreshed balances for ${allWalletAddresses.length} wallets`,
        // });
      }
    } catch (error: any) {
      console.error('Error refreshing pack wallet balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to fetch wallet balances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Only update loading state if this is still the current project
      if (currentProjectIdRef.current === requestProjectId) {
        // console.log(
        //   '[pack-bots] Setting loading states to false for project:',
        //   requestProjectId
        // );
        setIsRefreshingBalances(false);
        setIsInitialBalanceLoading(false);
      } else {
        console.log(
          '[pack-bots] Not updating loading state for stale project:',
          requestProjectId
        );
      }
    }
  }, [project?.tokenAddress, project?.addons, project?.chainName, toast]);

  // Reset state when project changes
  useEffect(() => {
    console.log(
      '[pack-bots] Project changed, resetting ALL state:',
      project?._id
    );
    currentProjectIdRef.current = project?._id;
    setIsInitialBalanceLoading(true);
    setDepositWalletBalances({});
    setIsRefreshingBalances(false);
    setDepositWalletBalance(null);

    // Reset packBots to initial state to clear old project values
    setPackBots([...initialPackBots]);

    // Reset all WebSocket states
    setCurrentExecutingBot(null);
    setBotCompletionStates({});
    setPackStatus('inactive');
  }, [project?._id]);

  // Auto-fetch balances when component mounts or project changes
  useEffect(() => {
    console.log('[pack-bots] useEffect triggered:', {
      hasTokenAddress: !!project?.tokenAddress,
      hasAddons: !!project?.addons,
      isInitialBalanceLoading,
      projectId: project?._id,
    });

    if (project?.tokenAddress && project?.addons) {
      console.log(
        '[pack-bots] Calling refreshPackWalletBalances from useEffect'
      );
      refreshPackWalletBalances();
    } else {
      console.log(
        '[pack-bots] Skipping balance fetch in useEffect - missing data'
      );
    }
  }, [
    project?._id,
    project?.tokenAddress,
    project?.addons,
    refreshPackWalletBalances,
  ]);

  // Update packBots with project data if available - similar to project-add-ons
  useEffect(() => {
    if (project?.addons && packConfig) {
      const updatedPackBots = [...initialPackBots];

      // Update SnipeBot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('SnipeBot') &&
        project.addons.SnipeBot
      ) {
        const bot = project.addons.SnipeBot;
        const index = updatedPackBots.findIndex((pb) => pb.type === `SnipeBot`);
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.snipeBotConfig,
            depositWallet: bot.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            tokenBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.tokenBalance ?? 0,
          };
        }
      }

      // Update VolumeBot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('VolumeBot') &&
        project.addons.VolumeBot
      ) {
        const bot = project.addons.VolumeBot;
        const index = updatedPackBots.findIndex(
          (pb) => pb.type === 'VolumeBot'
        );
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.volumeBotConfig,
            depositWallet: bot.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            generatedVolume: bot.generatedVolume ?? 0,
          };
        }
      }

      // Update HolderBot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('HolderBot') &&
        project.addons.HolderBot
      ) {
        const bot = project.addons.HolderBot;
        const index = updatedPackBots.findIndex(
          (pb) => pb.type === 'HolderBot'
        );
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.holderBotConfig,
            depositWallet: bot.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            generatedHolders: bot.generatedHolders ?? 0,
          };
        }
      }

      // Update AutoSellBot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('AutoSellBot') &&
        project.addons.AutoSellBot
      ) {
        const bot = project.addons.AutoSellBot;
        const index = updatedPackBots.findIndex(
          (pb) => pb.type === 'AutoSellBot'
        );
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.autoSellBotConfig,
            depositWallet: bot.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            totalTokenBalance: 0,
            countsOfActiveWallets: bot.countsOfActivaveWallets ?? 0,
          };
        }
      }

      // Update DistributionBot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('DistributionBot') &&
        project.addons.DistributionBot
      ) {
        const bot = project.addons.DistributionBot; // Use DistributionBot's own wallet
        const index = updatedPackBots.findIndex(
          (pb) => pb.type === `DistributionBot`
        );
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.distributionBotConfig,
            depositWallet: bot?.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot?.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            tokenBalance:
              depositWalletBalances[bot?.depositWalletId?.publicKey]
                ?.tokenBalance ?? 0,
            completedDistributions: (bot as any).completedDistributions ?? 0,
            totalDistributions: (bot as any).totalDistributions ?? 0,
          };
        }
      }

      // update of trending bot
      if (
        project.containingBots
          ?.map((type: string) => type)
          .includes('TrendingBot') &&
        project.addons.TrendingBot
      ) {
        const bot = project.addons.TrendingBot;
        const index = updatedPackBots.findIndex(
          (pb) => pb.type === 'TrendingBot'
        );
        if (index !== -1) {
          updatedPackBots[index] = {
            ...updatedPackBots[index],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            config: packConfig.trendingBotConfig,
            depositWallet: bot.depositWalletId?.publicKey || '',
            nativeBalance:
              depositWalletBalances[bot.depositWalletId?.publicKey]
                ?.nativeBalance ?? 0,
            generatedVolume: bot.generatedVolume ?? 0,
            elapsedMinutes: bot.elapsedMinutes ?? 0,
            targetMinutes: bot.targetMinutes ?? 0,
            trend: bot.trend,
          };
        }
      }

      // Filter bots based on project.containingBots array
      const filteredPackBots = updatedPackBots.filter((bot) => {
        // Check if bot type exists in containingBots array
        const botTypeExists = project.containingBots
          ?.map((type: string) => type.toUpperCase())
          .includes(bot.type.toUpperCase());
        return botTypeExists;
      });
      console.log('filteredPackBots : ', filteredPackBots);
      setPackBots(filteredPackBots);
    }
  }, [project, packConfig]); // ✅ Removed depositWalletBalances from dependencies

  // Separate useEffect to update balances without overwriting other data
  useEffect(() => {
    if (Object.keys(depositWalletBalances).length > 0) {
      setPackBots((prevPackBots) =>
        prevPackBots.map((bot) => ({
          ...bot, // ✅ Preserve existing data (generatedVolume, generatedHolders, etc.)
          nativeBalance:
            depositWalletBalances[bot.depositWallet]?.nativeBalance ??
            bot.nativeBalance,
          tokenBalance:
            depositWalletBalances[bot.depositWallet]?.tokenBalance ??
            bot.tokenBalance,
        }))
      );
    }
  }, [depositWalletBalances]); // ✅ Only update when balances change

  if (!packConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pack Configuration</CardTitle>
          <CardDescription>No pack configuration available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use the state variable instead of static computation

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Pack Bots & Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage all bots in your strategy pack with a single control
          </p>
        </div>

        {/* Master Pack Toggle */}
        <Card className="w-full sm:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="pack-toggle" className="font-medium">
                  Pack Start/Stop
                </Label>
                <p className="text-xs text-muted-foreground">
                  {packEnabled
                    ? 'All bots are active'
                    : 'All bots are inactive'}
                </p>
              </div>
              <Switch
                id="pack-toggle"
                checked={packEnabled}
                onCheckedChange={handlePackToggle}
                disabled={!isProjectOwner || isUpdating}
              />
              {isUpdating && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Operations Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto px-3 py-2 text-sm whitespace-nowrap"
            onClick={() => setIsWalletManagementModalOpen(true)}
            disabled={isRefreshingBalances}
          >
            Wallet Management
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={() => setIsManualSwapDialogOpen(true)}
            disabled={isRefreshingBalances}
          >
            Manual Token Swap
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={() => setIsManualLPDialogOpen(true)}
            disabled={isRefreshingBalances}
          >
            Manual LP Management
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={refreshPackWalletBalances}
            disabled={isRefreshingBalances}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshingBalances ? 'animate-spin' : ''}`}
            />
            Refresh Balances
          </Button>
        </div>
      </div>

      {/* Bot Progress Stepper */}

      <BotStepper
        packConfig={packConfig}
        packEnabled={packEnabled}
        botCompletionStates={botCompletionStates}
        currentExecutingBot={currentExecutingBot}
      />

      {/* Bot Configuration Cards - Similar to Add-Ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {packBots.map((bot) => {
          const isNativeDepositDialogOpen = dialogStates[bot.type] || false;

          return (
            <Card key={bot.type} className="w-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getBotIcon(bot.type)}
                    {getBotName(bot.type)}
                  </CardTitle>
                  <Badge
                    variant={
                      botCompletionStates[
                        bot.type === `SnipeBot`
                          ? 'SnipeBot'
                          : bot.type === 'VolumeBot'
                            ? 'VolumeBot'
                            : bot.type === 'HolderBot'
                              ? 'HolderBot'
                              : bot.type === 'AutoSellBot'
                                ? 'AutoSellBot'
                                : bot.type === 'TrendingBot'
                                  ? 'TrendingBot'
                                  : 'DistributionBot'
                      ]
                        ? 'default'
                        : currentExecutingBot ===
                            (bot.type === `SnipeBot`
                              ? 'SnipeBot'
                              : bot.type === 'VolumeBot'
                                ? 'VolumeBot'
                                : bot.type === 'HolderBot'
                                  ? 'HolderBot'
                                  : bot.type === 'AutoSellBot'
                                    ? 'AutoSellBot'
                                    : bot.type === 'TrendingBot'
                                      ? 'TrendingBot'
                                      : 'DistributionBot')
                          ? 'secondary'
                          : 'outline'
                    }
                    className="font-medium text-sm px-3 py-1 rounded-full"
                  >
                    {botCompletionStates[
                      bot.type === `SnipeBot`
                        ? 'SnipeBot'
                        : bot.type === 'VolumeBot'
                          ? 'VolumeBot'
                          : bot.type === 'HolderBot'
                            ? 'HolderBot'
                            : bot.type === 'AutoSellBot'
                              ? 'AutoSellBot'
                              : bot.type === 'TrendingBot'
                                ? 'TrendingBot'
                                : 'DistributionBot'
                    ]
                      ? 'Completed'
                      : currentExecutingBot ===
                          (bot.type === `SnipeBot`
                            ? 'SnipeBot'
                            : bot.type === 'VolumeBot'
                              ? 'VolumeBot'
                              : bot.type === 'HolderBot'
                                ? 'HolderBot'
                                : bot.type === 'AutoSellBot'
                                  ? 'AutoSellBot'
                                  : bot.type === 'TrendingBot'
                                    ? 'TrendingBot'
                                    : 'DistributionBot')
                        ? 'Running'
                        : packEnabled
                          ? 'Pending'
                          : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{getBotDescription(bot.type)}</CardDescription>
                {getTutorialLink(bot.type) && (
                  <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto font-normal"
                  >
                    <Link href={getTutorialLink(bot.type)!}>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      How it works
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {/* Enable/Disable Switch for individual bots */}
                {(bot.type === 'AutoSellBot' ||
                  bot.type === 'TrendingBot' ||
                  bot.type === 'DistributionBot') && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${bot.type}-toggle`}>Enable</Label>
                    <Switch
                      id={`${bot.type}-toggle`}
                      checked={configs[bot.type]?.enabled ?? false}
                      onCheckedChange={(checked) => {
                        if (isProjectOwner) {
                          if (checked) {
                            // When enabling, open configuration modal first
                            // Don't update state until configuration is complete
                            if (bot.type === 'AutoSellBot') {
                              setIsAutoSellBotDialogOpen(true);
                            } else if (bot.type === 'TrendingBot') {
                              setIsTrendingBotDialogOpen(true);
                            } else if (bot.type === 'DistributionBot') {
                              setIsDistributionBotDialogOpen(true);
                            } else {
                              // For bots without configuration modals, enable directly
                              handleToggle(bot.type);
                            }
                          } else {
                            // When disabling, update configs state and call handleToggle
                            setConfigs((prev) => ({
                              ...prev,
                              [bot.type]: {
                                ...prev[bot.type],
                                enabled: false,
                              },
                            }));
                            handleToggle(bot.type);
                          }
                        }
                      }}
                      disabled={!isProjectOwner}
                    />
                  </div>
                )}
                {(bot.type === 'AutoSellBot' ||
                  bot.type === 'TrendingBot' ||
                  bot.type === 'DistributionBot') && <Separator />}

                {/* Deposit Wallet Section */}
                {bot.depositWallet && (
                  <>
                    <div className="space-y-2">
                      <Label>Deposit Wallet</Label>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <code className="text-sm font-mono">
                          {bot.depositWallet.slice(0, 6)}...
                          {bot.depositWallet.slice(-4)}
                        </code>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(bot.depositWallet)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy address</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={`https://${project?.chainName === 'BSC_MAINNET' ? 'bscscan.com' : project?.chainName === 'ETH_MAINNET' ? 'etherscan.io' : 'solscan.io'}/address/${bot.depositWallet}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View on Explorer</span>
                            </a>
                          </Button>
                          {/* Only show download button for project owners */}
                          {isProjectOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  const blob =
                                    await walletApi.downloadWalletAsCsv(
                                      bot.depositWallet
                                    );
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute(
                                    'download',
                                    `wallet-${bot.depositWallet}.csv`
                                  );
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                  toast({
                                    title: 'Success',
                                    description:
                                      'Wallet downloaded successfully',
                                  });
                                } catch (error: any) {
                                  console.error(
                                    'Failed to download wallet:',
                                    error
                                  );
                                  toast({
                                    title:
                                      error.response?.data?.errorType ||
                                      'Download Failed',
                                    description:
                                      error.response?.data?.errorMessage
                                        ?.toString()
                                        .slice(0, 200) ||
                                      'Could not download wallet. Please try again.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download Wallet</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Balance Section */}
                <div className="flex flex-col w-full">
                  <Label>{nativeCurrency} Balance</Label>
                  <div className="flex items-center justify-between">
                    {isInitialBalanceLoading || isRefreshingBalances ? (
                      <Skeleton className="h-7 w-32" />
                    ) : (
                      <p className="text-xl font-bold">
                        {bot.nativeBalance.toFixed(4)} {nativeCurrency}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {isInitialBalanceLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDialog(bot.type, true)}
                        >
                          Deposit
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    {(bot.type === `SnipeBot` ||
                      bot.type === `DistributionBot`) &&
                      isProjectOwner &&
                      (isInitialBalanceLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (bot.type === `SnipeBot`) {
                              handlePostOperationDialogOpen();
                            } else if (bot.type === `DistributionBot`) {
                              handleDistributionPostOperationDialogOpen();
                            }
                          }}
                        >
                          Post-Operations
                        </Button>
                      ))}
                  </div>
                  <Suspense fallback={null}>
                    <NativeDepositDialog
                      open={isNativeDepositDialogOpen}
                      onOpenChange={(open) => toggleDialog(bot.type, open)}
                      depositWalletAddress={bot.depositWallet}
                      chainName={project?.chainName || 'BSC_MAINNET'}
                      onSuccess={() => {
                        // Refresh pack wallet balances after successful deposit
                        refreshPackWalletBalances();
                      }}
                    />
                  </Suspense>
                </div>

                {/* Sniped Token Balance for Snipe Bot */}
                {bot.type === `SnipeBot` && (
                  <div>
                    <Label>Sniped Token Balance</Label>
                    {isInitialBalanceLoading || isRefreshingBalances ? (
                      <Skeleton className="h-7 w-40" />
                    ) : (
                      <p className="text-xl font-bold">
                        {(
                          depositWalletBalances[bot.depositWallet]
                            ?.totalSnipeTokenBalance || 0
                        ).toFixed(2)}{' '}
                        {project?.symbol || project.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Generated Volume for Volume Bot */}
                {bot.type === 'VolumeBot' &&
                  bot.generatedVolume !== undefined && (
                    <div>
                      <Label>Generated Volume</Label>
                      <p className="text-xl font-bold">
                        ${formatNumber(bot.generatedVolume)}
                      </p>
                    </div>
                  )}

                {/* Generated Holders for Holder Bot */}
                {bot.type === 'HolderBot' &&
                  bot.generatedHolders !== undefined && (
                    <div>
                      <Label>Generated Holders</Label>
                      <p className="text-xl font-bold">
                        {bot.generatedHolders}
                      </p>
                    </div>
                  )}

                {/* Auto Sell Bot specific info */}
                {bot.type === 'AutoSellBot' && (
                  <div className="space-y-2 flex flex-col">
                    <Label>Total Token Balance</Label>
                    <p className="text-xl font-bold">
                      {bot.totalTokenBalance?.toFixed(2) || '0'}{' '}
                      {project?.symbol || project.name}
                    </p>
                    <Label>Active wallets</Label>
                    <p className="text-xl font-bold">
                      {bot.countsOfActiveWallets || '0'}
                    </p>
                  </div>
                )}

                {/* Distribution Bot specific info */}
                {bot.type === `DistributionBot` && (
                  <div className="space-y-2 flex flex-col">
                    <Label>Completed Distributions</Label>
                    <p className="text-xl font-bold">
                      {formatNumber(bot.completedDistributions || 0)}{' '}
                      {project?.symbol || project.name}
                    </p>
                  </div>
                )}

                {/* Trending Bot specific info */}
                {bot.type === 'TrendingBot' && (
                  <div className="space-y-2 flex flex-col">
                    <Label>Trend Direction</Label>
                    <p className="text-xl font-bold">
                      {bot.trend ? (
                        <span
                          className={`capitalize ${
                            bot.trend === 'upward'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {bot.trend === 'upward' ? '📈 Upward' : '📉 Downward'}
                        </span>
                      ) : (
                        'Not Set'
                      )}
                    </p>
                    <Label>Token Balance</Label>
                    {isInitialBalanceLoading || isRefreshingBalances ? (
                      <Skeleton className="h-7 w-40" />
                    ) : (
                      <p className="text-xl font-bold">
                        {bot.depositWallet &&
                        depositWalletBalances[bot.depositWallet]
                          ? (
                              depositWalletBalances[bot.depositWallet]
                                .tokenBalance || 0
                            ).toFixed(2)
                          : '0'}{' '}
                        {project?.symbol || project.name}
                      </p>
                    )}
                    <Label>Generated Volume</Label>
                    <p className="text-xl font-bold">
                      ${formatNumber(bot.generatedVolume || 0)}
                    </p>
                    <Label>Elapsed Minutes</Label>
                    <p className="text-xl font-bold">
                      {bot.elapsedMinutes || 0} min
                    </p>
                    <Label>Target Minutes</Label>
                    <p className="text-xl font-bold">
                      {bot.targetMinutes || 0} min
                    </p>
                  </div>
                )}

                {/* Achievement Status */}
                {botCompletionStates[
                  bot.type === `SnipeBot`
                    ? 'SnipeBot'
                    : bot.type === 'VolumeBot'
                      ? 'VolumeBot'
                      : bot.type === 'HolderBot'
                        ? 'HolderBot'
                        : bot.type === 'AutoSellBot'
                          ? 'AutoSellBot'
                          : bot.type === 'TrendingBot'
                            ? 'TrendingBot'
                            : 'DistributionBot'
                ] && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Objective completed!
                    </span>
                  </div>
                )}

                {/* Bot Objectives Section - Hidden for Auto Sell Bot and Trending Bot */}
                {bot.type !== 'AutoSellBot' && bot.type !== 'TrendingBot' && (
                  <>
                    <Separator className="mt-auto" />
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Objective</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getBotGoal(bot.type, bot.config)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Configuration
                        </Label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {bot.type === `SnipeBot` && (
                            <>
                              <div>
                                <span className="text-muted-foreground">
                                  Wallets:
                                </span>
                                <span className="ml-1 font-medium">
                                  {bot.config?.walletCount || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>
                                <span className="ml-1 font-medium">
                                  {formatNumber(bot.config?.tokenAmount || 0)}
                                </span>
                              </div>
                            </>
                          )}
                          {bot.type === 'VolumeBot' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">
                                  Min Amount:
                                </span>
                                <span className="ml-1 font-medium">
                                  {bot.config?.minNativeAmount || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Max Amount:
                                </span>
                                <span className="ml-1 font-medium">
                                  {bot.config?.maxNativeAmount || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Time Span:
                                </span>
                                <span className="ml-1 font-medium">
                                  {bot.config?.timeSpanBetweenTransactions /
                                    1000 || 0}
                                  s
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Target Volume:
                                </span>
                                <span className="ml-1 font-medium">
                                  ${formatNumber(bot.config?.targetVolume || 0)}
                                </span>
                              </div>
                            </>
                          )}
                          {bot.type === 'HolderBot' && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Target Holders:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNumber(bot.config?.targetHolders || 0)}
                              </span>
                            </div>
                          )}
                          {bot.type === `DistributionBot` && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Target Wallet Count:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNumber(
                                  bot.config?.targetWalletCount || 0
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>

              {/* CardFooter for Auto Sell Bot and Trending Bot */}
              {(bot.type === 'AutoSellBot' || bot.type === 'TrendingBot') && (
                <CardFooter className="flex flex-col items-start gap-4 mt-auto">
                  <p className="text-sm text-muted-foreground mb-2">
                    {bot.type === 'AutoSellBot'
                      ? `Please deposit ${nativeCurrency} to the wallet address above and click Execute to start use Auto sell bot`
                      : `Please deposit ${nativeCurrency} and ${project?.symbol} tokens to the wallet address above and click Execute to start generating trending volume.`}
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      className="w-full hover:bg-primary/90 transition-colors"
                      onClick={() =>
                        isProjectOwner
                          ? bot.type === 'AutoSellBot'
                            ? setIsAutoSellBotDialogOpen(true)
                            : setIsTrendingBotDialogOpen(true)
                          : toast({
                              title: 'Error',
                              description:
                                'You are not the owner of this project',
                              variant: 'destructive',
                            })
                      }
                      disabled={
                        !isProjectOwner ||
                        isRefreshingBalances ||
                        individualBotConfigs[bot.type]?.enabled
                      }
                    >
                      {individualBotConfigs[bot.type]?.enabled
                        ? 'Bot is Running - Use Switch to Disable'
                        : 'Configure & Execute'}
                    </Button>
                    {/* Buy & Fill Token Button for Trending Bot */}
                    {bot.type === 'TrendingBot' && (
                      <Button
                        variant="outline"
                        className="w-full hover:bg-secondary/90 transition-colors"
                        onClick={() =>
                          isProjectOwner
                            ? setIsTrendingBotBuyFillDialogOpen(true)
                            : toast({
                                title: 'Error',
                                description:
                                  'You are not the owner of this project',
                                variant: 'destructive',
                              })
                        }
                        disabled={!isProjectOwner || isRefreshingBalances}
                      >
                        Buy & Fill Tokens
                      </Button>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {/* Post-Operation Management Modal */}
      <Dialog
        open={postOperationDialogOpen}
        onOpenChange={setPostOperationDialogOpen}
      >
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post-Operation Management (Snipe Bot)</DialogTitle>
            <DialogDescription>
              Sell tokens and collect {nativeCurrency} after successful sniping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Wallet Management Section */}
            <div className="border rounded-lg p-6 w-full">
              <h3 className="text-base font-medium mb-3">Wallet Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your wallets, sell tokens, and collect {nativeCurrency}.
              </p>

              {/* Deposit Wallet Balance */}
              <div className="border rounded-lg p-6 bg-muted/10 mb-4">
                <h3 className="text-base font-medium mb-2">Deposit Wallet</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Address:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded truncate max-w-[200px]">
                        {(
                          (project as any)?.addons?.SnipeBot?.depositWalletId
                            ?.publicKey || ''
                        ).slice(0, 6)}
                        ...
                        {(
                          (project as any)?.addons?.SnipeBot?.depositWalletId
                            ?.publicKey || ''
                        ).slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          (project as any)?.addons?.SnipeBot?.depositWalletId &&
                          copyToClipboard(
                            (project as any).addons.SnipeBot.depositWalletId
                              .publicKey
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {nativeCurrency} Balance:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isLoadingBalance
                          ? 'Loading...'
                          : depositWalletBalance !== null
                            ? `${depositWalletBalance.toFixed(4)} ${nativeCurrency}`
                            : `0.0000 ${nativeCurrency}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={fetchDepositWalletBalance}
                        disabled={isLoadingBalance}
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {project?.symbol || project?.name} Balance:
                    </p>
                    <p className="font-medium">
                      {wallets
                        .find((w) => w.role === 'botmain')
                        ?.tokenBalance?.toFixed(4) || '0.0000'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extra Native Distribution */}
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="text-base font-medium mb-3">
                  Distribute Extra {nativeCurrency} (Recommended)
                </h3>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="extraDistributeNativeAmount"
                      className="whitespace-nowrap"
                    >
                      Amount per wallet:
                    </Label>
                    <Input
                      id="extraDistributeNativeAmount"
                      type="number"
                      value={extraDistributeNativeAmount}
                      onChange={(e) =>
                        setExtraDistributeNativeAmount(Number(e.target.value))
                      }
                      step="0.01"
                      min="0"
                      className="max-w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-fit">
                    <span className="text-sm">{nativeCurrency}</span>
                    <Button
                      className="bg-green-500 hover:bg-green-600 w-full sm:w-fit"
                      onClick={handleDistributeExtraNative}
                      disabled={
                        !wallets.filter(
                          (wallet: WalletInfo) => wallet.role !== 'botmain'
                        ).length || isDistributing
                      }
                    >
                      {isDistributing
                        ? 'Distributing...'
                        : `Distribute Extra ${nativeCurrency}`}
                    </Button>
                  </div>
                </div>

                <div className="border border-green-400 rounded-md p-3 mt-4 text-green-700 text-sm">
                  <p>
                    💡 This is useful for providing {nativeCurrency} to wallets
                    for sell/buy operations
                  </p>
                </div>
              </div>

              {/* Wallet Table */}
              <div className="border rounded-md max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">
                        <Checkbox
                          checked={isAllWalletsSelected}
                          onCheckedChange={handleSelectAllWallets}
                          data-state={
                            isSomeWalletsSelected && !isAllWalletsSelected
                              ? 'indeterminate'
                              : isAllWalletsSelected
                                ? 'checked'
                                : 'unchecked'
                          }
                          disabled={isLoadingBalances}
                        />
                      </TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">
                        {nativeCurrency}
                      </TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-center">Sell %</TableHead>
                      <TableHead className="text-center">
                        {nativeCurrency} Rate for buying %
                      </TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.length > 0 ? (
                      wallets
                        .filter((w) => w.role !== 'botmain')
                        .map((wallet) => (
                          <TableRow key={wallet.publicKey}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.nativeBalance || 0) <= 0
                                    ? false
                                    : wallet.isSelectedForMutilSell || false
                                }
                                onCheckedChange={(checked) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            isSelectedForMutilSell:
                                              checked === true,
                                          }
                                        : w
                                    )
                                  )
                                }
                                disabled={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.nativeBalance || 0) <= 0
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="text-xs font-mono">
                                  {wallet.publicKey.slice(0, 6)}...
                                  {wallet.publicKey.slice(-4)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={() =>
                                    copyToClipboard(wallet.publicKey)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    window.open(
                                      `https://${
                                        project?.chainName === 'BSC_MAINNET'
                                          ? 'bscscan.com'
                                          : project?.chainName === 'ETH_MAINNET'
                                            ? 'etherscan.io'
                                            : 'solscan.io'
                                      }/address/${wallet.publicKey}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.nativeBalance?.toFixed(4) || '0.0000'}
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.tokenBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.sellPercentage === undefined
                                    ? 100
                                    : wallet.sellPercentage
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            sellPercentage: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.nativeSpendRate === undefined
                                    ? 90
                                    : wallet.nativeSpendRate
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            nativeSpendRate: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-row gap-2 justify-center">
                                <Button
                                  className="h-8"
                                  variant="outline"
                                  onClick={() =>
                                    handleSingleBuy(wallet.publicKey)
                                  }
                                  disabled={
                                    executingSingleBuys[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell ||
                                    (wallet.nativeBalance || 0) <= 0
                                  }
                                >
                                  {executingSingleBuys[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Buy
                                </Button>
                                <Button
                                  className="h-8"
                                  onClick={() =>
                                    handleSingleSell(
                                      wallet.publicKey,
                                      wallet.sellPercentage || 100
                                    )
                                  }
                                  disabled={
                                    executingSingleSells[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell ||
                                    (wallet.tokenBalance || 0) <= 0
                                  }
                                >
                                  {executingSingleSells[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Sell
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <span className="text-sm text-muted-foreground">
                            No wallets found. Loading wallets...
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => {
                    const addresses = wallets.map((w) => w.publicKey);
                    fetchBalances(addresses);
                  }}
                  className="h-9"
                  variant="default"
                  disabled={isLoadingBalances}
                >
                  {isLoadingBalances && (
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingBalances ? 'animate-spin' : ''}`}
                    />
                  )}
                  {isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}
                </Button>

                <Button
                  onClick={handleCollectNative}
                  className="h-9"
                  variant="default"
                  disabled={
                    isCollectingNative ||
                    isExecutingMultiSell ||
                    !wallets.some(
                      (w) =>
                        w.role !== 'botmain' && (w.nativeBalance || 0) > 0.00001
                    )
                  }
                >
                  {isCollectingNative ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isCollectingNative
                    ? 'Collecting...'
                    : `Collect ${nativeCurrency}`}
                </Button>

                <Button
                  onClick={handleMultiSell}
                  className="h-9"
                  variant="default"
                  disabled={
                    isExecutingMultiSell ||
                    isCollectingNative ||
                    !wallets.some((w) => w.isSelectedForMutilSell)
                  }
                >
                  {isExecutingMultiSell ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isExecutingMultiSell
                    ? 'Selling...'
                    : `Multi Sell ${project?.symbol || project?.name}`}
                </Button>

                <Button
                  onClick={handleMultiBuy}
                  className="h-9"
                  variant="default"
                  disabled={
                    isExecutingMultiBuy ||
                    isCollectingNative ||
                    !wallets.some((w) => w.isSelectedForMutilSell)
                  }
                >
                  {isExecutingMultiBuy ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isExecutingMultiBuy
                    ? 'Buying...'
                    : `Multi Buy ${project?.symbol || project?.name}`}
                </Button>
              </div>

              <div className="border border-blue-400 rounded-md p-3 mt-4 text-blue-700 text-sm">
                <p>
                  💡 Check wallets and use "Multi Sell" to sell from multiple
                  wallets at once or use individual "Sell" buttons.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Distribution Bot Post-Operation Management Modal */}
      <Dialog
        open={distributionPostOperationDialogOpen}
        onOpenChange={setDistributionPostOperationDialogOpen}
      >
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Post-Operation Management (Distribution Bot)
            </DialogTitle>
            <DialogDescription>
              Manage distribution wallets and collect {nativeCurrency} after
              token distribution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Wallet Management Section */}
            <div className="border rounded-lg p-6 w-full">
              <h3 className="text-base font-medium mb-3">
                Distribution Wallet Management
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your distribution bot wallets, sell tokens, and collect{' '}
                {nativeCurrency}.
              </p>

              {/* Deposit Wallet Balance */}
              <div className="border rounded-lg p-6 bg-muted/10 mb-4">
                <h3 className="text-base font-medium mb-2">
                  Distribution Bot Deposit Wallet
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Address:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted/20 px-1 py-0.5 rounded truncate max-w-[200px]">
                        {(
                          (project as any)?.addons?.DistributionBot
                            ?.depositWalletId?.publicKey || ''
                        ).slice(0, 6)}
                        ...
                        {(
                          (project as any)?.addons?.DistributionBot
                            ?.depositWalletId?.publicKey || ''
                        ).slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          (project as any)?.addons?.DistributionBot
                            ?.depositWalletId &&
                          copyToClipboard(
                            (project as any).addons.DistributionBot
                              .depositWalletId.publicKey
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {nativeCurrency} Balance:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isLoadingBalance
                          ? 'Loading...'
                          : depositWalletBalances[
                              (project as any)?.addons?.DistributionBot
                                ?.depositWalletId?.publicKey
                            ]?.nativeBalance?.toFixed(4) || '0.0000'}{' '}
                        {nativeCurrency}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={refreshPackWalletBalances}
                        disabled={isRefreshingBalances}
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${isRefreshingBalances ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {project?.symbol || project?.name} Balance:
                    </p>
                    <p className="font-medium">
                      {depositWalletBalances[
                        (project as any)?.addons?.DistributionBot
                          ?.depositWalletId?.publicKey
                      ]?.tokenBalance?.toFixed(4) || '0.0000'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distribution Stats */}
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="text-base font-medium mb-3">
                  Distribution Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Target Wallets:
                    </p>
                    <p className="font-semibold text-lg">
                      {packBots.find((b) => b.type === `DistributionBot`)
                        ?.config?.targetWalletCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Completed Distributions:
                    </p>
                    <p className="font-semibold text-lg">
                      {packBots.find((b) => b.type === `DistributionBot`)
                        ?.completedDistributions || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Table */}
              <div className="border rounded-md max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="text-center">
                        <Checkbox
                          checked={isAllWalletsSelected}
                          onCheckedChange={handleSelectAllWallets}
                          data-state={
                            isSomeWalletsSelected && !isAllWalletsSelected
                              ? 'indeterminate'
                              : isAllWalletsSelected
                                ? 'checked'
                                : 'unchecked'
                          }
                          disabled={isLoadingBalances}
                        />
                      </TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">
                        {nativeCurrency}
                      </TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-center">Sell %</TableHead>
                      <TableHead className="text-center">
                        {nativeCurrency} Rate for buying %
                      </TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.length > 0 ? (
                      wallets
                        .filter((w) => w.role === 'botsub_target')
                        .map((wallet) => (
                          <TableRow key={wallet.publicKey}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.nativeBalance || 0) <= 0
                                    ? false
                                    : wallet.isSelectedForMutilSell || false
                                }
                                onCheckedChange={(checked) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            isSelectedForMutilSell:
                                              checked === true,
                                          }
                                        : w
                                    )
                                  )
                                }
                                disabled={
                                  (wallet.tokenBalance || 0) <= 0 &&
                                  (wallet.nativeBalance || 0) <= 0
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="text-xs font-mono">
                                  {wallet.publicKey.slice(0, 6)}...
                                  {wallet.publicKey.slice(-4)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={() =>
                                    copyToClipboard(wallet.publicKey)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    window.open(
                                      `https://${
                                        project?.chainName === 'BSC_MAINNET'
                                          ? 'bscscan.com'
                                          : project?.chainName === 'ETH_MAINNET'
                                            ? 'etherscan.io'
                                            : 'solscan.io'
                                      }/address/${wallet.publicKey}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.nativeBalance?.toFixed(4) || '0.0000'}
                            </TableCell>
                            <TableCell className="text-right">
                              {wallet.tokenBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.sellPercentage === undefined
                                    ? 100
                                    : wallet.sellPercentage
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            sellPercentage: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 w-16 text-center"
                                min={1}
                                max={100}
                                value={
                                  wallet.nativeSpendRate === undefined
                                    ? 90
                                    : wallet.nativeSpendRate
                                }
                                onChange={(e) =>
                                  setWallets((prev) =>
                                    prev.map((w) =>
                                      w.publicKey === wallet.publicKey
                                        ? {
                                            ...w,
                                            nativeSpendRate: Number(
                                              e.target.value
                                            ),
                                          }
                                        : w
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-row gap-2 justify-center">
                                <Button
                                  className="h-8"
                                  variant="outline"
                                  onClick={() =>
                                    handleSingleBuy(wallet.publicKey)
                                  }
                                  disabled={
                                    executingSingleBuys[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell ||
                                    (wallet.nativeBalance || 0) <= 0
                                  }
                                >
                                  {executingSingleBuys[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Buy
                                </Button>
                                <Button
                                  className="h-8"
                                  onClick={() =>
                                    handleSingleSell(
                                      wallet.publicKey,
                                      wallet.sellPercentage || 100
                                    )
                                  }
                                  disabled={
                                    executingSingleSells[wallet.publicKey] ||
                                    wallet.isSelectedForMutilSell ||
                                    (wallet.tokenBalance || 0) <= 0
                                  }
                                >
                                  {executingSingleSells[wallet.publicKey] ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Sell
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <span className="text-sm text-muted-foreground">
                            No distribution wallets found. Loading wallets...
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => {
                    const addresses = wallets.map((w) => w.publicKey);
                    fetchBalances(addresses);
                  }}
                  className="h-9"
                  variant="default"
                  disabled={isLoadingBalances}
                >
                  {isLoadingBalances && (
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingBalances ? 'animate-spin' : ''}`}
                    />
                  )}
                  {isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}
                </Button>

                <Button
                  onClick={handleCollectNative}
                  className="h-9"
                  variant="default"
                  disabled={
                    isCollectingNative ||
                    isExecutingMultiSell ||
                    !wallets.some(
                      (w) =>
                        w.role !== 'botmain' && (w.nativeBalance || 0) > 0.00001
                    )
                  }
                >
                  {isCollectingNative ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isCollectingNative
                    ? 'Collecting...'
                    : `Collect ${nativeCurrency}`}
                </Button>

                <Button
                  onClick={handleMultiSell}
                  className="h-9"
                  variant="default"
                  disabled={
                    isExecutingMultiSell ||
                    isCollectingNative ||
                    !wallets.some((w) => w.isSelectedForMutilSell)
                  }
                >
                  {isExecutingMultiSell ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isExecutingMultiSell
                    ? 'Selling...'
                    : `Multi Sell ${project?.symbol || project?.name}`}
                </Button>

                <Button
                  onClick={handleMultiBuy}
                  className="h-9"
                  variant="default"
                  disabled={
                    isExecutingMultiBuy ||
                    isCollectingNative ||
                    !wallets.some((w) => w.isSelectedForMutilSell)
                  }
                >
                  {isExecutingMultiBuy ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isExecutingMultiBuy
                    ? 'Buying...'
                    : `Multi Buy ${project?.symbol || project?.name}`}
                </Button>
              </div>

              <div className="border border-blue-400 rounded-md p-3 mt-4 text-blue-700 text-sm">
                <p>
                  💡 Manage distribution wallets used for token distribution.
                  Check wallets and use "Multi Sell" to collect tokens from
                  multiple wallets or use individual actions.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Token Swap Dialog */}
      <Suspense fallback={null}>
        {isManualSwapDialogOpen && (
          <ManualSwapDialog
            open={isManualSwapDialogOpen}
            onOpenChange={setIsManualSwapDialogOpen}
          />
        )}
      </Suspense>

      {/* Manual LP Management Dialog */}
      <Suspense fallback={null}>
        {isManualLPDialogOpen && (
          <ManualLPDialog
            open={isManualLPDialogOpen}
            onOpenChange={setIsManualLPDialogOpen}
          />
        )}
      </Suspense>

      {/* Wallet Management Modal */}
      <Suspense fallback={null}>
        {isWalletManagementModalOpen && (
          <WalletManagementModal
            open={isWalletManagementModalOpen}
            onOpenChange={setIsWalletManagementModalOpen}
            project={project}
          />
        )}
      </Suspense>

      {/* Distribution Bot Dialog */}
      <Suspense fallback={null}>
        {isDistributionBotDialogOpen && (
          <DistributionBotDialog
            open={isDistributionBotDialogOpen}
            onOpenChange={setIsDistributionBotDialogOpen}
            project={project}
            onConfigurationSuccess={() =>
              handleBotConfigurationSuccess('DistributionBot')
            }
          />
        )}
      </Suspense>

      {/* Trending Bot Dialog */}
      <Suspense fallback={null}>
        {isTrendingBotDialogOpen && (
          <TrendingBotDialog
            open={isTrendingBotDialogOpen}
            onOpenChange={(open) => setIsTrendingBotDialogOpen(open)}
            onConfigurationSuccess={() =>
              handleBotConfigurationSuccess('TrendingBot')
            }
          />
        )}
      </Suspense>

      {/* Auto Sell Bot Dialog */}
      <Suspense fallback={null}>
        {isAutoSellBotDialogOpen && (
          <AutoSellBotDialog
            open={isAutoSellBotDialogOpen}
            onOpenChange={setIsAutoSellBotDialogOpen}
            _wallets={[]}
            _onWalletsChange={() => {}}
            onConfigurationSuccess={() =>
              handleBotConfigurationSuccess('AutoSellBot')
            }
          />
        )}
      </Suspense>

      {/* Trending Bot Buy & Fill Dialog */}
      <Dialog
        open={isTrendingBotBuyFillDialogOpen}
        onOpenChange={setIsTrendingBotBuyFillDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buy & Fill Tokens for Trending Bot</DialogTitle>
            <DialogDescription>
              Buy {project?.symbol || project?.name} tokens using{' '}
              {nativeCurrency} and automatically fill them to the trending bot
              deposit wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Balance Display */}
            <div className="border rounded-lg p-4 bg-muted/10">
              <h3 className="text-sm font-medium mb-2">Current Balances</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    {nativeCurrency} Balance:
                  </p>
                  <p className="font-semibold">
                    {(() => {
                      const trendingBot = packBots.find(
                        (bot) => bot.type === 'TrendingBot'
                      );
                      const balance = trendingBot?.nativeBalance;
                      return typeof balance === 'number'
                        ? balance.toFixed(4)
                        : '0';
                    })()}{' '}
                    {nativeCurrency}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Token Balance:</p>
                  <p className="font-semibold">
                    {(() => {
                      const trendingBot = packBots.find(
                        (bot) => bot.type === 'TrendingBot'
                      );
                      const tokenBalance =
                        trendingBot?.depositWallet &&
                        depositWalletBalances[trendingBot.depositWallet]
                          ?.tokenBalance;
                      return typeof tokenBalance === 'number'
                        ? tokenBalance.toFixed(2)
                        : '0';
                    })()}{' '}
                    {project?.symbol || project?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Buy Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="buy-amount">
                Amount to spend ({nativeCurrency})
              </Label>
              <Input
                id="buy-amount"
                type="number"
                placeholder={`Enter ${nativeCurrency} amount`}
                value={trendingBotBuyAmount}
                onChange={(e) => setTrendingBotBuyAmount(e.target.value)}
                min="0"
                step="0.001"
              />
              <p className="text-xs text-muted-foreground">
                This amount will be used to buy{' '}
                {project?.symbol || project?.name} tokens at current market
                price with 5% slippage tolerance.
              </p>
            </div>

            {/* Warning */}
            <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Important Notes:</p>
                  <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
                    <li>Tokens will be bought at current market price</li>
                    <li>5% slippage tolerance will be applied</li>
                    <li>
                      Ensure sufficient {nativeCurrency} balance in deposit
                      wallet
                    </li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsTrendingBotBuyFillDialogOpen(false);
                setTrendingBotBuyAmount('');
              }}
              disabled={isExecutingTrendingBotBuy}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTrendingBotBuyFill}
              disabled={
                isExecutingTrendingBotBuy ||
                !trendingBotBuyAmount ||
                parseFloat(trendingBotBuyAmount) <= 0
              }
            >
              {isExecutingTrendingBotBuy && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {isExecutingTrendingBotBuy
                ? 'Buying...'
                : `Buy Tokens with ${trendingBotBuyAmount || '0'} ${nativeCurrency}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
