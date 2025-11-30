'use client';

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WalletInfo } from './auto-sell-wizard-dialog';
import { HolderBotWizardDialog } from './holder-bot-wizard-dialog';
import { ManualLPDialog } from './manual-lp-dialog';
import { ManualSwapDialog } from './manual-swap-dialog';
import { WalletManagementModal } from './wallet-management-modal';
import {
  AlertTriangle,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, getBadgeVariant } from '@/lib/utils';
import { BotService } from '@/services/botService';
import { walletApi } from '@/services/walletApi';
import {
  formatValue,
  getNativeBalance,
  getWalletBalances,
} from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { toggleBot } from '@/store/slices/botSlice';
import { fetchProject } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

// Lazy load dialog components
const NativeDepositeDialog = lazy(() =>
  import('@/components/projects/native-deposit-dialog').then((module) => ({
    default: module.NativeDepositDialog,
  }))
);

const BundleSnipingDialog = lazy(() =>
  import('./bundle-sniping-dialog').then((module) => ({
    default: module.BundleSnipingDialog,
  }))
);
const AutoSellWizardDialog = lazy(() =>
  import('./auto-sell-wizard-dialog').then((module) => ({
    default: module.AutoSellWizardDialog,
  }))
);
const VolumeBotWizardDialog = lazy(() =>
  import('./volume-bot-wizard-dialog').then((module) => ({
    default: module.VolumeBotWizardDialog,
  }))
);
const DistributionBotDialog = lazy(() =>
  import('./distribution-bot-dialog').then((module) => ({
    default: module.DistributionBotDialog,
  }))
);
const TrendingBotWizardDialog = lazy(() =>
  import('./trending-bot-wizard-dialog').then((module) => ({
    default: module.TrendingBotWizardDialog,
  }))
);

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
    const required = requiredMatch ? parseInt(requiredMatch[1], 10) / 1e18 : 0;
    const additionalNeeded = required - available;

    return {
      title: 'Insufficient Funds',
      message: `Your wallet ${address} has insufficient funds. Available: ${available.toFixed(6)} ${nativeCurrency}, Required: ${required.toFixed(6)} ${nativeCurrency}. Please add at least ${additionalNeeded.toFixed(6)} ${nativeCurrency} to proceed.`,
    };
  }

  // Add more error parsing cases here as needed
  return { title: 'Error', message };
};

// Define the Speed type here to avoid conflicts
type Speed = 'slow' | 'medium' | 'fast';

type AutoSellConfig = {
  enabled: boolean;
  targetPrice: number;
  stopLoss: number;
};

type LiquidationSnipeBotStatus =
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

type BotConfig = {
  _id?: string;
  status?: LiquidationSnipeBotStatus | string;
  enabled: boolean;
  amount: number;
  nativeCurrency: number;
  tokenAmount: number;
  autoSell: AutoSellConfig;
  speed: Speed;
  maxBundleSize: number;
  wallets?: Array<{
    address: string;
    nativeBalance: number;
    tokenBalance: number;
    sellPrice: number;
    enabled: boolean;
  }>;
};

type ConfigsType = {
  [key: string]: BotConfig;
};

// Define the addon structure
type AddonType = {
  _id: string;
  botType: string;
  name: string;
  description: string;
  depositWallet: string;
  balances: {
    native: number;
    token?: number;
  };
  tutorialLink: string;
  walletCount?: number;
  totalNativeBalance?: number;
  totalTokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
  countsOfActivaveWallets?: number;
  completedDistributions?: number;
  totalDistributions?: number;
  elapsedMinutes?: number;
  targetMinutes?: number;
  trend?: 'upward' | 'downward';
};

// Initialize addOns with empty values
const initialAddOns: AddonType[] = [
  {
    botType: 'SnipeBot',
    _id: '',
    name: 'Snipe Bot',
    description:
      'You can perform first sniping with multiple user wallets in the same bundle transaction.',
    depositWallet: '',
    balances: {
      native: 0,
      token: 0,
    },
    tutorialLink: '/tutorials/add-ons/bundle-snipe',
    walletCount: 10,
    totalNativeBalance: 0,
    totalTokenBalance: 0,
  },
  {
    botType: 'DistributionBot',
    _id: '',
    name: 'Distribution Bot',
    description:
      'Distribute tokens across multiple wallets to simulate a diverse holder base.',
    depositWallet: '',
    balances: {
      native: 0,
    },
    completedDistributions: 0,
    totalDistributions: 0,
    tutorialLink: '/tutorials/add-ons/DistributionBot',
  },
  {
    botType: 'AutoSellBot',
    _id: '',
    name: 'Auto Sell Bot',
    description:
      'Automatically sell tokens when the price reaches a certain target.',
    depositWallet: '',
    balances: {
      native: 0,
    },
    countsOfActivaveWallets: 0,
    totalTokenBalance: 0,
    tutorialLink: '/tutorials/add-ons/auto-sell-bot',
  },
  {
    botType: 'HolderBot',
    _id: '',
    name: 'Holder Bot',
    description:
      'Simulate a diverse holder base by distributing tokens across multiple wallets.',
    depositWallet: '',
    balances: {
      native: 0,
    },
    generatedHolders: 0,
    tutorialLink: '/tutorials/add-ons/holder-bot',
  },
  {
    botType: 'VolumeBot',
    _id: '',
    name: 'Volume Bot',
    description:
      "Boost your token's trading volume with automated buy and sell transactions.",
    depositWallet: '',
    balances: {
      native: 0,
    },
    generatedVolume: 0,
    tutorialLink: '/tutorials/add-ons/volume-bot',
  },
  {
    botType: 'TrendingBot',
    _id: '',
    name: 'Trending Bot',
    description:
      'Create trending market movements with automated trading patterns.',
    depositWallet: '',
    balances: {
      native: 0,
    },
    generatedVolume: 0,
    tutorialLink: '/tutorials/add-ons/trending-bot',
  },
];

// Define types for wallet balances
type WalletBalances = {
  [address: string]: {
    nativeBalance: number;
    tokenBalance?: number;
    totalSnipeTokenBalance?: number; // Total token balance across all snipe wallets
  };
};

export function ProjectAddOns({ project }: { project: ProjectWithAddons }) {
  const { id: projectId } = useParams() as { id: string };
  const [addOns, setAddOns] = useState<AddonType[]>(initialAddOns);
  const [depositWalletBalances, setDepositWalletBalances] =
    useState<WalletBalances>({});
  const [configs, setConfigs] = useState<ConfigsType>(
    initialAddOns.reduce(
      (acc, addon) => ({
        ...acc,
        [addon.botType]: {
          _id: addon._id,
          status:
            addon.botType === 'SnipeBot'
              ? ('ready_to_simulation' as LiquidationSnipeBotStatus)
              : undefined,
          enabled: false,
          amount: 1000,
          nativeCurrency: 0,
          tokenAmount: 0,
          autoSell: {
            enabled: false,
            targetPrice: 0,
            stopLoss: 0,
          },
          speed: 'medium' as Speed,
          maxBundleSize: 0.25,
        },
      }),
      {} as ConfigsType
    )
  );
  const [isSimulateDialogOpen, setIsSimulateDialogOpen] = useState(false);
  const [isAutoSellDialogOpen, setIsAutoSellDialogOpen] = useState(false);
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  const [isTrendingBotBuyFillDialogOpen, setIsTrendingBotBuyFillDialogOpen] =
    useState(false);
  const [trendingBotBuyAmount, setTrendingBotBuyAmount] = useState('');
  const [isExecutingTrendingBotBuy, setIsExecutingTrendingBotBuy] =
    useState(false);
  // Create a state object to track dialog open states for each addon
  const [dialogStates, setDialogStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const initialBalancesFetched = useRef(false);
  const [isInitialBalanceLoading, setIsInitialBalanceLoading] = useState(true);
  const currentProjectIdRef = useRef(project?._id);
  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isManualSwapDialogOpen, setIsManualSwapDialogOpen] = useState(false);
  const [isWalletManagementModalOpen, setIsWalletManagementModalOpen] =
    useState(false);
  const [isManualLPDialogOpen, setIsManualLPDialogOpen] = useState(false);
  const [isHolderBotDialogOpen, setIsHolderBotDialogOpen] = useState(false);
  const [isDistributionBotDialogOpen, setIsDistributionBotDialogOpen] =
    useState(false);
  const [isTrendingBotDialogOpen, setIsTrendingBotDialogOpen] = useState(false);

  // Failsafe: Clear loading state after 10 seconds regardless
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitialBalanceLoading) {
        console.log(
          '[project-addons] Failsafe: Clearing loading state after timeout'
        );
        setIsInitialBalanceLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isInitialBalanceLoading]);

  // Check if current user is the project owner
  const isProjectOwner = useMemo(() => {
    if (!user || !project || !project.owner) return false;

    const ownerWalletAddress =
      typeof project.owner === 'string'
        ? project.owner
        : project.owner.walletAddress;

    return (
      user.walletAddress?.toLowerCase() === ownerWalletAddress?.toLowerCase()
    );
  }, [user, project]);

  // Create a memoized version of refreshWalletBalances to avoid dependency issues
  const memoizedRefreshWalletBalances = useCallback(async () => {
    if (!project?.tokenAddress || !project?.addons) {
      console.log(
        '[project-addons] Skipping balance fetch - missing project data'
      );
      setIsInitialBalanceLoading(false);
      return;
    }

    const requestProjectId = project._id;
    console.log(
      '[project-addons] Starting balance fetch for project:',
      requestProjectId
    );
    try {
      setIsRefreshingBalances(true);

      // Get all wallet addresses from all add-ons (including snipe sub-wallets)
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

      if (project.addons.TrendingBot?.depositWalletId?.publicKey) {
        const address = project.addons.TrendingBot.depositWalletId.publicKey;
        allWalletAddresses.push(address);
        walletToTypeMap[address] = 'TrendingBot';
      }

      console.log('[project]', project);
      // Fetch balances for all wallets at once
      if (allWalletAddresses.length > 0) {
        const balancesArray = await getWalletBalances(
          allWalletAddresses,
          project.tokenAddress,
          project.chainName
        );

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
          console.log(
            '[project-addons] Balance fetch completed successfully for project:',
            requestProjectId
          );
        } else {
          console.log(
            '[project-addons] Discarding stale balance response for project:',
            requestProjectId,
            'current project:',
            currentProjectIdRef.current
          );
        }
      }
    } catch (error: any) {
      console.error('Error refreshing wallet balances:', error);
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
        //   '[project-addons] Setting loading states to false for project:',
        //   requestProjectId
        // );
        setIsRefreshingBalances(false);
        setIsInitialBalanceLoading(false);
      } else {
        console.log(
          '[project-addons] Not updating loading state for stale project:',
          requestProjectId
        );
      }
    }
  }, [project?.tokenAddress, project?.addons, toast]);

  // Reset state when project changes
  useEffect(() => {
    console.log(
      '[project-addons] Project changed, resetting ALL state:',
      project?._id
    );
    currentProjectIdRef.current = project?._id;
    initialBalancesFetched.current = false;
    setIsInitialBalanceLoading(true);
    setDepositWalletBalances({});
    setIsRefreshingBalances(false);

    // Reset addOns to initial state to clear old project values
    setAddOns([...initialAddOns]);

    // Reset configs to initial state
    setConfigs(
      initialAddOns.reduce(
        (acc, addon) => ({
          ...acc,
          [addon.botType]: {
            _id: '',
            status:
              addon.botType === 'SnipeBot'
                ? ('ready_to_simulation' as LiquidationSnipeBotStatus)
                : undefined,
            enabled: false,
            amount: 1000,
            nativeCurrency: 0,
            tokenAmount: 0,
            autoSell: {
              enabled: false,
              targetPrice: 0,
              stopLoss: 0,
            },
            speed: 'medium' as Speed,
            maxBundleSize: 0.25,
          },
        }),
        {} as ConfigsType
      )
    );
  }, [project?._id]);

  // Add debug logging to the useEffect hook
  useEffect(() => {
    console.log('[project-addons] useEffect triggered:', {
      hasTokenAddress: !!project?.tokenAddress,
      initialBalancesFetched: initialBalancesFetched.current,
      isInitialBalanceLoading,
      projectId: project?._id,
    });

    if (!project?.tokenAddress || initialBalancesFetched.current) {
      console.log('[project-addons] Skipping balance fetch in useEffect');
      return;
    }

    console.log(
      '[project-addons] Calling memoizedRefreshWalletBalances from useEffect'
    );
    memoizedRefreshWalletBalances();
    initialBalancesFetched.current = true;
  }, [project?._id, project?.tokenAddress, memoizedRefreshWalletBalances]);

  // Update addOns and configs with project data if available
  useEffect(() => {
    if (project?.addons) {
      // Create a copy of addOns to modify
      const updatedAddOns = [...addOns];
      const updatedConfigs = { ...configs };

      // Update SnipeBot
      if (project.addons.SnipeBot) {
        const bot = project.addons.SnipeBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'SnipeBot'
        );
        if (index !== -1) {
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            generatedVolume: bot.generatedVolume ?? 0,
            generatedHolders: bot.generatedHolders ?? 0,
          };

          // Update config
          updatedConfigs['SnipeBot'] = {
            ...updatedConfigs['SnipeBot'],
            _id: bot._id,
            enabled: bot.isEnabled || false,
            status: (bot.status as LiquidationSnipeBotStatus) || 'Inactive',
          };
        }
      }

      // Update VolumeBot
      if (project.addons.VolumeBot) {
        const bot = project.addons.VolumeBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'VolumeBot'
        );
        if (index !== -1) {
          const currentVolume = updatedAddOns[index].generatedVolume || 0;
          const backendVolume = bot.generatedVolume || 0;

          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            //generatedVolume: bot.generatedVolume ?? 0,
            generatedVolume: Math.max(currentVolume, backendVolume),
          };

          // Update config
          updatedConfigs['VolumeBot'] = {
            ...updatedConfigs['VolumeBot'],
            _id: bot._id,
            enabled: bot.isEnabled || false,
          };
        }
      }

      // Update HolderBot
      if (project.addons.HolderBot) {
        const bot = project.addons.HolderBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'HolderBot'
        );
        if (index !== -1) {
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            generatedHolders: bot.generatedHolders ?? 0,
          };

          // Update config
          updatedConfigs['HolderBot'] = {
            ...updatedConfigs['HolderBot'],
            _id: bot._id,
            enabled: bot.isEnabled || false,
          };
        }
      }

      if (project.addons.AutoSellBot) {
        const bot = project.addons?.AutoSellBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'AutoSellBot'
        );

        if (index !== -1 && bot) {
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            countsOfActivaveWallets: bot.countsOfActivaveWallets ?? 0,
          };

          // Update config
          updatedConfigs['AutoSellBot'] = {
            ...updatedConfigs['AutoSellBot'],
            _id: bot._id,
            // Consider bot enabled if explicitly enabled OR if it has active wallets
            enabled:
              bot.isEnabled ||
              (bot.countsOfActivaveWallets &&
                bot.countsOfActivaveWallets > 0) ||
              false,
          };
        } else {
          console.warn(
            'AutoSellBot not found in addOns array or bot data is missing'
          );
        }
      }

      if (project.addons?.DistributionBot) {
        const bot = project.addons?.DistributionBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'DistributionBot'
        );

        if (index !== -1 && bot) {
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            completedDistributions: (bot as any).completedDistributions ?? 0,
            totalDistributions: (bot as any).totalDistributions ?? 0,
          };

          // Update config
          updatedConfigs['DistributionBot'] = {
            ...updatedConfigs['DistributionBot'],
            _id: bot._id,
            enabled: bot.isEnabled || false,
          };
        } else {
          console.warn(
            'DistributionBot not found in addOns array or bot data is missing'
          );
        }
      }

      if (project.addons?.TrendingBot) {
        const bot = project.addons?.TrendingBot;
        const index = updatedAddOns.findIndex(
          (addon) => addon.botType === 'TrendingBot'
        );

        if (index !== -1 && bot) {
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            generatedVolume: (bot as any).generatedVolume ?? 0,
            trend: bot.trend,
            elapsedMinutes: bot.elapsedMinutes ?? 0,
            targetMinutes: bot.targetMinutes ?? 0,
          };

          // Update config
          updatedConfigs['TrendingBot'] = {
            ...updatedConfigs['TrendingBot'],
            _id: bot._id,
            // Consider bot enabled if explicitly enabled OR if it has generated volume/activity
            enabled:
              bot.isEnabled ||
              (bot.generatedVolume && bot.generatedVolume > 0) ||
              false,
          };
        } else {
          console.warn(
            'TrendingBot not found in addOns array or bot data is missing'
          );
        }
      }
      // Update the state
      setAddOns(updatedAddOns);
      setConfigs(updatedConfigs);
    }
  }, [project?._id, project]);

  // Add WebSocket listener for volume generation updates
  useEffect(() => {
    if (!projectId) return;

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
              : project?.chainName === 'SOMNIA_TESTNET' ||
                  project?.chainName === 'SOMNIA_MAINNET'
                ? 'SOMI'
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

        // Update local state optimistically
        setConfigs((prev) => ({
          ...prev,
          ['VolumeBot']: { ...prev['VolumeBot'], enabled: false },
        }));
      } else {
        console.log('Volume generated successfully:', data.generatedVolume);
        if (data.generatedVolume > 0) {
          toast({
            title: 'Volume Generated',
            description: `Successfully generated ${data.generatedVolume.toFixed(5)} volume`,
            variant: 'default',
          });

          // Update the volume count in the UI
          setAddOns((prevAddOns) =>
            prevAddOns.map((addon) =>
              addon.botType === 'VolumeBot'
                ? {
                    ...addon,
                    generatedVolume: Number(
                      (
                        (addon.generatedVolume || 0) + data.generatedVolume
                      ).toFixed(5)
                    ),
                  }
                : addon
            )
          );
        }
      }
      // Refresh wallet balances after volume generation update
      memoizedRefreshWalletBalances();
    };

    // Connect and join with error handling
    try {
      websocketService.connect();
      websocketService.joinProject(projectId);
      websocketService.subscribe(
        WebSocketEvents.VOLUME_GENERATION_UPDATED,
        handleVolumeGenerationUpdate
      );
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      toast({
        title: error.response?.data?.errorType || 'Connection Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to establish WebSocket connection. Please try again.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        websocketService.unsubscribe(
          WebSocketEvents.VOLUME_GENERATION_UPDATED,
          handleVolumeGenerationUpdate
        );
        websocketService.leaveProject(projectId);
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
    };
  }, [projectId, project, dispatch, toast]);

  // Add WebSocket listener for holder generation updates
  useEffect(() => {
    if (!projectId) return;

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
      completed?: boolean;
      isEnabled?: boolean;
      status?: string;
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
              : project?.chainName === 'SOMNIA_TESTNET' ||
                  project?.chainName === 'SOMNIA_MAINNET'
                ? 'SOMI'
                : 'SOL';

        const { title, message } = parseErrorMessage(
          data.error.message,
          data.error.details,
          nativeCurrency
        );

        // Update local state optimistically
        setConfigs((prev) => ({
          ...prev,
          ['HolderBot']: { ...prev['HolderBot'], enabled: false },
        }));
        toast({
          title,
          description: message,
          variant: 'destructive',
        });
      } else {
        console.log('Holders generated successfully:', data.generatedHolders);

        // Update bot status if provided
        if (
          data.isEnabled !== undefined ||
          data.completed !== undefined ||
          data.status
        ) {
          setConfigs((prev) => ({
            ...prev,
            ['HolderBot']: {
              ...prev['HolderBot'],
              enabled:
                data.isEnabled !== undefined
                  ? data.isEnabled
                  : prev['HolderBot']?.enabled,
              status: data.status || prev['HolderBot']?.status,
            },
          }));
        }

        // Show completion toast if bot completed
        if (data.completed) {
          toast({
            title: 'Holder Bot Completed',
            description: `Successfully generated ${data.generatedHolders} holders. Target reached!`,
            variant: 'default',
          });
        } else if (data.generatedHolders > 0) {
          toast({
            title: 'Holders Generated',
            description: `Successfully generated ${data.generatedHolders} holders`,
            variant: 'default',
          });
        }

        // Update the holder count in the UI
        if (data.generatedHolders > 0) {
          setAddOns((prevAddOns) =>
            prevAddOns.map((addon) =>
              addon.botType === 'HolderBot'
                ? { ...addon, generatedHolders: data.generatedHolders }
                : addon
            )
          );
        }
      }
      // Refresh wallet balances after holder generation update
      memoizedRefreshWalletBalances();
    };

    // Connect and join with error handling
    try {
      websocketService.connect();
      websocketService.joinProject(projectId);
      websocketService.subscribe(
        WebSocketEvents.HOLDER_GENERATION_UPDATED,
        handleHolderGenerationUpdate
      );
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      toast({
        title: error.response?.data?.errorType || 'Connection Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to establish WebSocket connection. Please try again.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        websocketService.unsubscribe(
          WebSocketEvents.HOLDER_GENERATION_UPDATED,
          handleHolderGenerationUpdate
        );
        websocketService.leaveProject(projectId);
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
    };
  }, [projectId, dispatch, toast]);

  // Add WebSocket listener for distribution updates
  useEffect(() => {
    if (!projectId) return;

    const handleDistributionUpdate = (data: {
      projectId: string;
      distributionBotId: string;
      sourceWallets: number;
      targetWallets: number;
      distributionStyle: string;
      estimatedAmount: number;
      chainName: string;
      efficiency: number;
      totalWallets: number;
      timestamp: string;
      error?: any;
    }) => {
      console.log('🔄 [ProjectAddOns] Received distribution update:', data);

      if (data.projectId !== projectId) {
        console.warn('🔄 [ProjectAddOns] Project ID mismatch, ignoring update');
        return;
      }

      if (data.error) {
        console.error('Distribution error:', data.error);
        toast({
          title: 'Distribution Error',
          description:
            typeof data.error !== 'string'
              ? data.error.message
              : 'An error occurred during distribution',
          variant: 'destructive',
        });

        // Update local state to disable the bot on error
        setConfigs((prev) => ({
          ...prev,
          ['DistributionBot']: { ...prev['DistributionBot'], enabled: false },
        }));

        // Dispatch toggleBot to disable the bot in Redux store
        if (project?.addons?.DistributionBot?._id) {
          dispatch(
            toggleBot({
              projectId: project?._id || projectId,
              botId: project.addons.DistributionBot._id,
              enabled: false,
            })
          )
            .unwrap()
            .then(() => {
              // Refresh project data to sync with backend
              dispatch(fetchProject(project?._id || projectId));
            })
            .catch((error) => {
              console.error('Failed to disable distribution bot:', error);
            });
        }
      } else {
        console.log('Distribution update received:', {
          efficiency: data.efficiency,
          estimatedAmount: data.estimatedAmount,
          sourceWallets: data.sourceWallets,
          targetWallets: data.targetWallets,
        });

        // Show success toast when distribution completes
        if (data.efficiency === 100) {
          toast({
            title: 'Distribution Complete',
            description: `Successfully distributed ${data.estimatedAmount?.toLocaleString() || 0} tokens to ${data.targetWallets} wallets`,
          });

          // Refresh the project data to sync with backend
          dispatch(fetchProject(project?._id || projectId));
        }

        // Update the distribution stats in the UI if needed
        setAddOns((prevAddOns) =>
          prevAddOns.map((addon) =>
            addon.botType === 'DistributionBot'
              ? {
                  ...addon,
                  completedDistributions: data.estimatedAmount || 0,
                  totalDistributions: data.totalWallets || 0,
                }
              : addon
          )
        );
      }

      // Refresh wallet balances after distribution update
      memoizedRefreshWalletBalances();
    };

    // Connect and join with error handling
    try {
      websocketService.connect();
      websocketService.joinProject(projectId);
      websocketService.subscribe(
        WebSocketEvents.DISTRIBUTION_UPDATES,
        handleDistributionUpdate
      );
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      toast({
        title: error.response?.data?.errorType || 'Connection Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to establish WebSocket connection. Please try again.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        websocketService.unsubscribe(
          WebSocketEvents.DISTRIBUTION_UPDATES,
          handleDistributionUpdate
        );
        websocketService.leaveProject(projectId);
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
    };
  }, [projectId, dispatch, toast, memoizedRefreshWalletBalances]);

  // Add WebSocket listener for trending bot updates
  useEffect(() => {
    if (!projectId) return;

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
              : project?.chainName === 'SOMNIA_TESTNET' ||
                  project?.chainName === 'SOMNIA_MAINNET'
                ? 'SOMI'
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

        // Update local state optimistically
        setConfigs((prev) => ({
          ...prev,
          ['TrendingBot']: { ...prev['TrendingBot'], enabled: false },
        }));
      } else {
        console.log(
          'Trending volume generated successfully:',
          data.generatedVolume
        );
        if (data.generatedVolume > 0) {
          toast({
            title: 'Trending Volume Generated',
            description: `Successfully generated ${data.generatedVolume.toFixed(5)} trending volume for ${data.generatedTrending}`,
            variant: 'default',
          });

          // Fetch latest project data to get updated trending bot information
          try {
            console.log(
              'Fetching updated project data for trending bot metrics'
            );
            const resultAction = await dispatch(fetchProject(projectId));

            if (fetchProject.fulfilled.match(resultAction)) {
              const updatedProject = resultAction.payload;
              console.log('Fetched updated project data:', updatedProject);

              // Extract trending bot data from the project
              const trendingBot = updatedProject?.addons?.TrendingBot;
              if (trendingBot) {
                console.log('Extracted trending bot data:', trendingBot);

                // Update the trending bot addon with latest data from project
                setAddOns((prevAddOns) =>
                  prevAddOns.map((addon) =>
                    addon.botType === 'TrendingBot'
                      ? {
                          ...addon,
                          generatedVolume: trendingBot.generatedVolume || 0,
                          trend: data.generatedTrending as
                            | 'upward'
                            | 'downward',
                          elapsedMinutes: trendingBot.elapsedMinutes,
                          targetMinutes: trendingBot.targetMinutes,
                          walletCount: trendingBot.subWalletIds?.length || 0,
                          totalNativeBalance: trendingBot.nativeBalance || 0,
                          totalTokenBalance: trendingBot.tokenBalance || 0,
                        }
                      : addon
                  )
                );

                // Log detailed metrics for debugging
                console.log('Trending bot metrics updated from project data:', {
                  botId: trendingBot._id,
                  generatedVolume: trendingBot.generatedVolume,
                  trend: data.generatedTrending,
                  elapsedMinutes: trendingBot.elapsedMinutes,
                  targetMinutes: trendingBot.targetMinutes,
                  walletCount: trendingBot.subWalletIds?.length || 0,
                  nativeBalance: trendingBot.nativeBalance,
                  tokenBalance: trendingBot.tokenBalance,
                });
              } else {
                console.warn(
                  'No trending bot found in project data, using basic update'
                );
                // Fallback to basic update if no trending bot in project
                setAddOns((prevAddOns) =>
                  prevAddOns.map((addon) =>
                    addon.botType === 'TrendingBot'
                      ? {
                          ...addon,
                          generatedVolume:
                            (addon.generatedVolume || 0) + data.generatedVolume,
                          trend: data.generatedTrending as
                            | 'upward'
                            | 'downward',
                        }
                      : addon
                  )
                );
              }
            } else {
              console.warn('Failed to fetch project data, using basic update');
              // Fallback to basic update if project fetch fails
              setAddOns((prevAddOns) =>
                prevAddOns.map((addon) =>
                  addon.botType === 'TrendingBot'
                    ? {
                        ...addon,
                        generatedVolume:
                          (addon.generatedVolume || 0) + data.generatedVolume,
                        trend: data.generatedTrending as 'upward' | 'downward',
                      }
                    : addon
                )
              );
            }
          } catch (error) {
            console.error(
              'Error fetching project data for trending bot metrics:',
              error
            );
            // Fallback to basic update if project fetch fails
            setAddOns((prevAddOns) =>
              prevAddOns.map((addon) =>
                addon.botType === 'TrendingBot'
                  ? {
                      ...addon,
                      generatedVolume:
                        (addon.generatedVolume || 0) + data.generatedVolume,
                      trend: data.generatedTrending as 'upward' | 'downward',
                    }
                  : addon
              )
            );
          }
        }
      }
      // Refresh wallet balances after trending bot update
      memoizedRefreshWalletBalances();
    };

    // Connect and join with error handling
    try {
      websocketService.connect();
      websocketService.joinProject(projectId);
      websocketService.subscribe(
        WebSocketEvents.TRENDING_GENERATION_UPDATED,
        handleTrendingBotUpdate
      );
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      toast({
        title: error.response?.data?.errorType || 'Connection Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to establish WebSocket connection. Please try again.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        websocketService.unsubscribe(
          WebSocketEvents.TRENDING_GENERATION_UPDATED,
          handleTrendingBotUpdate
        );
        websocketService.leaveProject(projectId);
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
    };
  }, [projectId, project, dispatch, toast, memoizedRefreshWalletBalances]);

  const handleToggle = async (botType: string) => {
    if (!project?._id || !projectId || !configs[botType]._id) {
      toast({
        title: 'Error',
        description: 'Project ID is missing. Cannot toggle bot.',
        variant: 'destructive',
      });
      return;
    }

    // Get the current enabled state
    const currentEnabled = configs[botType].enabled;
    console.log('currentEnabled---------', currentEnabled);
    if (botType === 'VolumeBot' && !currentEnabled) {
      setIsVolumeDialogOpen(true);
      return;
    }

    if (botType === 'HolderBot' && !currentEnabled) {
      setIsHolderBotDialogOpen(true);
      return;
    }

    if (botType === 'DistributionBot' && !currentEnabled) {
      setIsDistributionBotDialogOpen(true);
      return;
    }

    if (botType === 'TrendingBot' && !currentEnabled) {
      setIsTrendingBotDialogOpen(true);
      return;
    }

    // Update local state optimistically first
    const newConfigs = {
      ...configs,
      [botType]: { ...configs[botType], enabled: !currentEnabled },
    };
    setConfigs(newConfigs);

    // Dispatch the toggle action to the Redux store
    dispatch(
      toggleBot({
        projectId: project?._id || projectId,
        botId: configs[botType]._id,
        enabled: !currentEnabled,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: `Bot ${!currentEnabled ? 'Enabled' : 'Disabled'}`,
          description: `${addOns.find((addon) => addon.botType === botType)?.name} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
        });
      })
      .catch((error) => {
        // Revert the optimistic update on error
        setConfigs((prev) => ({
          ...prev,
          [botType]: { ...prev[botType], enabled: currentEnabled },
        }));

        toast({
          title: error.response?.data?.errorType || 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to toggle bot. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const _handleSave = (id: string) => {
    if (id === 'SnipeBot' && configs[id].status === 'auto_selling') {
      handleSaveAutoSell({ wallets: configs[id].wallets || [] });
      return;
    }
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], isEditing: false },
    }));
    toast({
      title: 'Changes Saved',
      description: `${addOns.find((addon) => addon.botType === id)?.name} configuration has been updated.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Address copied',
      description: 'Deposit wallet address has been copied to clipboard',
    });
  };

  const handleSaveAutoSell = (newConfig: { wallets: any[] }) => {
    setConfigs((prev) => ({
      ...prev,
      SnipeBot: { ...prev['SnipeBot'], wallets: newConfig.wallets },
    }));
  };

  // Function to toggle dialog state for a specific addon
  const toggleDialog = (addonType: string, isOpen: boolean) => {
    setDialogStates((prev) => ({
      ...prev,
      [addonType]: isOpen,
    }));
  };

  // Function to handle successful bot configuration and enable the bot
  const handleBotConfigurationSuccess = (botType: string) => {
    setConfigs((prev) => ({
      ...prev,
      [botType]: {
        ...prev[botType],
        enabled: true,
      },
    }));
    handleToggle(botType);

    // Refresh wallet balances after successful bot operations
    memoizedRefreshWalletBalances();
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

        // Refresh wallet balances
        memoizedRefreshWalletBalances();

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

  if (!project) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : project?.chainName === 'SOMNIA_TESTNET' ||
            project?.chainName === 'SOMNIA_MAINNET'
          ? 'SOMI'
          : 'SOL';

  return (
    <div className="space-y-6">
      {!configs || typeof configs !== 'object' ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Add-Ons & Configuration</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
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
                className="w-full sm:w-auto px-3 py-2 text-sm whitespace-nowrap"
                onClick={() => setIsManualSwapDialogOpen(true)}
                disabled={isRefreshingBalances}
              >
                Manual Token Swap
              </Button>

              <Button
                variant="outline"
                size="default"
                className="w-full sm:w-auto px-3 py-2 text-sm whitespace-nowrap"
                onClick={() => setIsManualLPDialogOpen(true)}
                disabled={isRefreshingBalances}
              >
                Manual LP Management
              </Button>

              <Button
                variant="outline"
                size="default"
                className="w-full sm:w-auto px-3 py-2 text-sm whitespace-nowrap"
                onClick={memoizedRefreshWalletBalances}
                disabled={isRefreshingBalances}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshingBalances ? 'animate-spin' : ''}`}
                />
                Refresh Balances
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-4">
            {addOns.map((addon) => {
              // Use the dialog state from the dialogStates object
              const isNativeDepositDialogOpen =
                dialogStates[addon.botType] || false;

              return (
                <Card key={addon.botType} className="w-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{addon.name}</CardTitle>
                      <Badge
                        variant={getBadgeVariant(
                          configs[addon.botType].enabled ? 'active' : 'inactive'
                        )}
                        className="font-medium text-sm px-3 py-1 rounded-full"
                      >
                        {configs[addon.botType].enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{addon.description}</CardDescription>
                    {addon.tutorialLink && (
                      <Button
                        variant="link"
                        asChild
                        className="p-0 h-auto font-normal"
                      >
                        <Link href={addon.tutorialLink}>
                          <HelpCircle className="w-4 h-4 mr-2" />
                          How it works
                        </Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${addon.botType}-toggle`}>Enable</Label>
                      <Switch
                        id={`${addon.botType}-toggle`}
                        checked={configs[addon.botType]?.enabled ?? false}
                        onCheckedChange={(checked) => {
                          if (isProjectOwner) {
                            if (checked) {
                              // When enabling, open configuration modal first
                              // Don't update state until configuration is complete
                              if (addon.botType === 'SnipeBot') {
                                setIsSimulateDialogOpen(true);
                              } else if (addon.botType === 'AutoSellBot') {
                                setIsAutoSellDialogOpen(true);
                              } else if (addon.botType === 'VolumeBot') {
                                setIsVolumeDialogOpen(true);
                              } else if (addon.botType === 'HolderBot') {
                                setIsHolderBotDialogOpen(true);
                              } else if (addon.botType === 'DistributionBot') {
                                setIsDistributionBotDialogOpen(true);
                              } else if (addon.botType === 'TrendingBot') {
                                setIsTrendingBotDialogOpen(true);
                              } else {
                                // For bots without configuration modals, enable directly
                                setConfigs((prev) => ({
                                  ...prev,
                                  [addon.botType]: {
                                    ...prev[addon.botType],
                                    enabled: checked,
                                  },
                                }));
                                handleToggle(addon.botType);
                              }
                            } else {
                              // When disabling, update immediately
                              setConfigs((prev) => ({
                                ...prev,
                                [addon.botType]: {
                                  ...prev[addon.botType],
                                  enabled: checked,
                                },
                              }));
                              handleToggle(addon.botType);
                            }
                          }
                        }}
                        disabled={!isProjectOwner}
                      />
                    </div>
                    {addon.depositWallet && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label>Deposit Wallet</Label>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <code className="text-sm font-mono">
                              {addon.depositWallet.slice(0, 6)}...
                              {addon.depositWallet.slice(-4)}
                            </code>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  copyToClipboard(addon.depositWallet)
                                }
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
                                  href={`https://${
                                    project?.chainName === 'BSC_MAINNET'
                                      ? 'bscscan.com'
                                      : project?.chainName === 'ETH_MAINNET'
                                        ? 'etherscan.io'
                                        : project?.chainName ===
                                            'SOMNIA_TESTNET'
                                          ? 'shannon-explorer.somnia.network'
                                          : 'solscan.io'
                                  }/address/${addon.depositWallet}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">
                                    View on Explorer
                                  </span>
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
                                      const publicKey = addon.depositWallet;
                                      const blob =
                                        await walletApi.downloadWalletAsCsv(
                                          publicKey
                                        );

                                      // Create a URL for the blob
                                      const url =
                                        window.URL.createObjectURL(blob);

                                      // Create a temporary link element
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.setAttribute(
                                        'download',
                                        `wallet-${publicKey}.csv`
                                      );

                                      // Append to the document, click it, and remove it
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      // Clean up the URL object
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
                                  <span className="sr-only">
                                    Download Wallet
                                  </span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {addon.balances && (
                      <div className="flex flex-col w-full">
                        <Label>{nativeCurrency} Balance</Label>
                        <div className="flex items-center justify-between">
                          {(() => {
                            const showSkeleton =
                              isInitialBalanceLoading || isRefreshingBalances;
                            // console.log(
                            //   '[project-addons] Native balance render:',
                            //   {
                            //     isInitialBalanceLoading,
                            //     isRefreshingBalances,
                            //     showSkeleton,
                            //     hasBalanceData:
                            //       !!depositWalletBalances[addon.depositWallet],
                            //   }
                            // );
                            return showSkeleton ? (
                              <Skeleton className="h-7 w-32" />
                            ) : (
                              <p className="text-xl font-bold">
                                {addon.depositWallet &&
                                depositWalletBalances[addon.depositWallet]
                                  ? formatValue(
                                      depositWalletBalances[addon.depositWallet]
                                        .nativeBalance,
                                      4
                                    )
                                  : '0'}{' '}
                                {nativeCurrency}
                              </p>
                            );
                          })()}
                          {isInitialBalanceLoading ? (
                            <Skeleton className="h-8 w-20" />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto"
                              onClick={() => toggleDialog(addon.botType, true)}
                            >
                              Deposit
                            </Button>
                          )}
                        </div>
                        <NativeDepositeDialog
                          open={isNativeDepositDialogOpen}
                          onOpenChange={(open) =>
                            toggleDialog(addon.botType, open)
                          }
                          depositWalletAddress={addon.depositWallet}
                          chainName={project?.chainName}
                          onSuccess={() => {
                            // Refresh wallet balances after successful deposit
                            memoizedRefreshWalletBalances();
                          }}
                        />
                      </div>
                    )}
                    {addon.botType === 'SnipeBot' && (
                      <div>
                        <Label>Sniped Token Balance</Label>
                        {isInitialBalanceLoading || isRefreshingBalances ? (
                          <Skeleton className="h-7 w-40" />
                        ) : (
                          <p className="text-xl font-bold">
                            {addon.depositWallet &&
                            depositWalletBalances[addon.depositWallet]
                              ? formatValue(
                                  depositWalletBalances[addon.depositWallet]
                                    .totalSnipeTokenBalance || 0,
                                  2
                                )
                              : '0'}{' '}
                            {project?.symbol || project.name}
                          </p>
                        )}
                      </div>
                    )}
                    {addon.botType === 'VolumeBot' &&
                      addon.generatedVolume !== undefined && (
                        <div>
                          <Label>Generated Volume</Label>
                          <p className="text-xl font-bold">
                            ${parseFloat(addon.generatedVolume.toFixed(5))}
                          </p>
                        </div>
                      )}
                    {addon.botType === 'TrendingBot' && (
                      <div>
                        <Label>Token Balance</Label>
                        {isInitialBalanceLoading || isRefreshingBalances ? (
                          <Skeleton className="h-7 w-40" />
                        ) : (
                          <p className="text-xl font-bold">
                            {addon.depositWallet &&
                            depositWalletBalances[addon.depositWallet]
                              ? (
                                  depositWalletBalances[addon.depositWallet]
                                    .tokenBalance || 0
                                ).toFixed(2)
                              : '0'}{' '}
                            {project?.symbol || project.name}
                          </p>
                        )}
                      </div>
                    )}
                    {addon.botType === 'TrendingBot' && (
                      <>
                        <div>
                          <Label>Trend Direction</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold">
                              {addon.trend ? (
                                <span
                                  className={`capitalize ${
                                    addon.trend === 'upward'
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {addon.trend === 'upward'
                                    ? '📈 Upward'
                                    : '📉 Downward'}
                                </span>
                              ) : (
                                'Not Set'
                              )}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label>Generated Trending Volume</Label>
                          <p className="text-xl font-bold">
                            $
                            {parseFloat(
                              addon.generatedVolume?.toFixed(5) || '0'
                            )}
                          </p>
                        </div>
                        <div>
                          <Label>Elapsed Minutes</Label>
                          <p className="text-xl font-bold">
                            {addon.elapsedMinutes || 0} min
                          </p>
                        </div>
                        <div>
                          <Label>Target Minutes</Label>
                          <p className="text-xl font-bold">
                            {addon.targetMinutes || 0} min
                          </p>
                        </div>
                      </>
                    )}
                    {addon.botType === 'HolderBot' &&
                      addon.generatedHolders !== undefined && (
                        <div>
                          <Label>Generated Holders</Label>
                          <p className="text-xl font-bold">
                            {addon.generatedHolders}
                          </p>
                        </div>
                      )}
                    {addon.botType === 'AutoSellBot' && (
                      <div className="space-y-2 flex flex-col ">
                        <Label>Total Token Balance</Label>
                        <p className="text-xl font-bold">
                          {addon.totalTokenBalance !== undefined
                            ? addon.totalTokenBalance.toFixed(2)
                            : '0'}{' '}
                          {project?.symbol || project.name}
                        </p>
                        <Label>Active wallets</Label>
                        <p className="text-xl font-bold">
                          {addon.countsOfActivaveWallets !== undefined
                            ? addon.countsOfActivaveWallets
                            : '0'}
                        </p>
                      </div>
                    )}
                    {addon.botType === 'DistributionBot' && (
                      <div className="space-y-2 flex flex-col">
                        <Label>Completed Distributions</Label>
                        <p className="text-xl font-bold">
                          {addon.completedDistributions !== undefined
                            ? formatNumber(addon.completedDistributions)
                            : '0'}{' '}
                          {project?.symbol || project.name}
                        </p>
                        <Label>Total Distributions</Label>
                        <p className="text-xl font-bold">
                          {addon.totalDistributions !== undefined
                            ? formatNumber(addon.totalDistributions)
                            : '0'}{' '}
                          {project?.symbol || project.name}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4 mt-auto">
                    {addon.botType === 'HolderBot' ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please deposit {nativeCurrency} to the wallet address
                          above and click Execute to start generating{' '}
                          {project?.chainName === 'BSC_MAINNET'
                            ? ' holders'
                            : ' volume'}
                          .
                        </p>
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() =>
                            isProjectOwner
                              ? setIsHolderBotDialogOpen(true)
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
                            configs['HolderBot']?.enabled
                          }
                        >
                          {configs['HolderBot']?.enabled
                            ? 'Bot is Running'
                            : 'Configure & Execute'}
                        </Button>
                      </>
                    ) : addon.botType === 'AutoSellBot' ||
                      addon.botType === 'VolumeBot' ||
                      addon.botType === 'DistributionBot' ||
                      addon.botType === 'TrendingBot' ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          {addon.botType === 'AutoSellBot'
                            ? `Please deposit ${nativeCurrency} to the wallet address above and click Execute to start use Auto sell bot`
                            : addon.botType === 'VolumeBot'
                              ? `Please deposit ${nativeCurrency} to the wallet address above and click Execute to start generating volume.`
                              : addon.botType === 'TrendingBot'
                                ? `Please deposit ${nativeCurrency} and ${project?.symbol} tokens to the wallet address above and click Execute to start generating trending volume.`
                                : `Please deposit ${nativeCurrency} to the wallet address above and click Execute to start use Distribution Bot`}
                        </p>
                        <div
                          className={`flex flex-col gap-2 w-full ${addon.botType === 'TrendingBot' ? '' : ''}`}
                        >
                          <Button
                            className="w-full hover:bg-primary/90 transition-colors"
                            onClick={() =>
                              isProjectOwner
                                ? addon.botType === 'AutoSellBot'
                                  ? setIsAutoSellDialogOpen(true)
                                  : addon.botType === 'VolumeBot'
                                    ? setIsVolumeDialogOpen(true)
                                    : addon.botType === 'TrendingBot'
                                      ? setIsTrendingBotDialogOpen(true)
                                      : setIsDistributionBotDialogOpen(true)
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
                              configs[addon.botType]?.enabled
                            }
                          >
                            {configs[addon.botType]?.enabled
                              ? 'Bot is Running'
                              : 'Configure & Execute'}
                          </Button>
                          {/* Buy & Fill Token Button for Trending Bot */}
                          {addon.botType === 'TrendingBot' && (
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
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please deposit {nativeCurrency} to the wallet address
                          above and click Execute to start use sniping bot.
                        </p>
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() =>
                            isProjectOwner
                              ? setIsSimulateDialogOpen(true)
                              : toast({
                                  title: 'Error',
                                  description:
                                    'You are not the owner of this project',
                                  variant: 'destructive',
                                })
                          }
                          disabled={!isProjectOwner || isRefreshingBalances}
                        >
                          Simulate & Execute
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Suspense fallback={null}>
            {isSimulateDialogOpen && (
              <BundleSnipingDialog
                open={isSimulateDialogOpen}
                onOpenChange={setIsSimulateDialogOpen}
                onConfigurationSuccess={() =>
                  handleBotConfigurationSuccess('SnipeBot')
                }
              />
            )}
          </Suspense>
          {/* hide on going to production */}
          <Suspense fallback={null}>
            {isAutoSellDialogOpen && (
              <AutoSellWizardDialog
                open={isAutoSellDialogOpen}
                onOpenChange={setIsAutoSellDialogOpen}
                _wallets={wallets}
                _onWalletsChange={setWallets}
                onConfigurationSuccess={() =>
                  handleBotConfigurationSuccess('AutoSellBot')
                }
              />
            )}
          </Suspense>
          <Suspense fallback={null}>
            {isVolumeDialogOpen && (
              <VolumeBotWizardDialog
                open={isVolumeDialogOpen}
                onOpenChange={setIsVolumeDialogOpen}
                onConfigurationSuccess={() =>
                  handleBotConfigurationSuccess('VolumeBot')
                }
              />
            )}
          </Suspense>
          <Suspense fallback={null}>
            {isManualSwapDialogOpen && (
              <ManualSwapDialog
                open={isManualSwapDialogOpen}
                onOpenChange={setIsManualSwapDialogOpen}
              />
            )}
          </Suspense>
          <Suspense fallback={null}>
            {isManualLPDialogOpen && (
              <ManualLPDialog
                open={isManualLPDialogOpen}
                onOpenChange={setIsManualLPDialogOpen}
              />
            )}
          </Suspense>
          <Suspense fallback={null}>
            {isHolderBotDialogOpen && (
              <HolderBotWizardDialog
                open={isHolderBotDialogOpen}
                onOpenChange={setIsHolderBotDialogOpen}
                onConfigurationSuccess={() =>
                  handleBotConfigurationSuccess('HolderBot')
                }
              />
            )}
          </Suspense>
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
          <Suspense fallback={null}>
            {isTrendingBotDialogOpen && (
              <TrendingBotWizardDialog
                open={isTrendingBotDialogOpen}
                onOpenChange={setIsTrendingBotDialogOpen}
                onConfigurationSuccess={() =>
                  handleBotConfigurationSuccess('TrendingBot')
                }
              />
            )}
          </Suspense>

          {/* Wallet Management Modal */}
          <WalletManagementModal
            open={isWalletManagementModalOpen}
            onOpenChange={setIsWalletManagementModalOpen}
            project={project}
          />

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
                  {nativeCurrency} and automatically fill them to the trending
                  bot deposit wallet.
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
                          const trendingBot = addOns.find(
                            (addon) => addon.botType === 'TrendingBot'
                          );
                          const balance = trendingBot?.balances?.native;
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
                          const trendingBot = addOns.find(
                            (addon) => addon.botType === 'TrendingBot'
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
                      <p className="font-medium text-amber-800">
                        Important Notes:
                      </p>
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
        </>
      )}
    </div>
  );
}
