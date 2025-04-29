'use client';

import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WalletInfo } from './auto-sell-wizard-dialog';
// import { BundleSnipingDialog } from './bundle-sniping-dialog';   // (hide on going to production)
import { Copy, Download, ExternalLink, HelpCircle, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { BnbDepositDialog } from '@/components/projects/bnb-deposit-dialog';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, getBadgeVariant } from '@/lib/utils';
import { BotService } from '@/services/botService';
import { walletApi } from '@/services/walletApi';
import { getWalletBalances as getWeb3WalletBalances } from '@/services/web3Utils';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { toggleBot } from '@/store/slices/botSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

// Lazy load dialog components
const SnipeWizardDialog = lazy(() => import('./snipe-wizard-dialog').then(module => ({ default: module.SnipeWizardDialog })));
const AutoSellWizardDialog = lazy(() => import('./auto-sell-wizard-dialog').then(module => ({ default: module.AutoSellWizardDialog })));
const VolumeBotWizardDialog = lazy(() => import('./volume-bot-wizard-dialog').then(module => ({ default: module.VolumeBotWizardDialog })));

// Utility function for parsing error messages
const parseErrorMessage = (message: string, details: string) => {
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
      message: `Your wallet ${address} has insufficient funds. Available: ${available.toFixed(6)} BNB, Required: ${required.toFixed(6)} BNB. Please add at least ${additionalNeeded.toFixed(6)} BNB to proceed.`,
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
  status?: LiquidationSnipeBotStatus;
  enabled: boolean;
  amount: number;
  nativeCurrency: number;
  tokenAmount: number;
  autoSell: AutoSellConfig;
  speed: Speed;
  maxBundleSize: number;
  wallets?: Array<{
    address: string;
    bnbBalance: number;
    tokenBalance: number;
    sellPrice: number;
    enabled: boolean;
  }>;
};

type ConfigsType = {
  [key: string]: BotConfig;
};

interface ProjectAddOnsProps {
  project?: ProjectWithAddons;
}

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
  totalBnbBalance?: number;
  totalTokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
  countsOfActivaveWallets?: number;
};

// Initialize addOns with empty values
const initialAddOns: AddonType[] = [
  {
    botType: 'SnipeBot',
    _id: '',
    name: 'Liquidation & Snipe Bot',
    description:
      'You can perform first sniping with multiple user wallets in the same bundle transaction.',
    depositWallet: '',
    balances: {
      native: 0,
      token: 0,
    },
    tutorialLink: '/tutorials/add-ons/SnipeBot',
    walletCount: 10,
    totalBnbBalance: 0,
    totalTokenBalance: 0,
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
    tutorialLink: '/tutorials/add-ons/AutoSellBot',
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
    tutorialLink: '/tutorials/add-ons/VolumeBot',
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
    tutorialLink: '/tutorials/add-ons/HolderBot',
  },
];

// Define types for wallet balances
type WalletBalances = {
  [address: string]: {
    bnbBalance: number;
    tokenBalance?: number;
  };
};

export function ProjectAddOns({ project }: ProjectAddOnsProps) {
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
  const [_editingBot, _setEditingBot] = useState<string | null>(null);
  const [isSimulateDialogOpen, setIsSimulateDialogOpen] = useState(false);
  const [isAutoSellDialogOpen, setIsAutoSellDialogOpen] = useState(false);
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  // Create a state object to track dialog open states for each addon
  const [dialogStates, setDialogStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const _botState = useSelector((state: RootState) => state.bots);
  const [_isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const initialBalancesFetched = useRef(false);
  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

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
      return;
    }

    try {
      setIsRefreshingBalances(true);

      // Get all deposit wallet addresses from all add-ons
      const depositWalletAddresses: string[] = [];
      const walletToTypeMap: { [key: string]: string } = {};

      if (project.addons.SnipeBot?.depositWalletId?.publicKey) {
        const address = project.addons.SnipeBot.depositWalletId.publicKey;
        depositWalletAddresses.push(address);
        walletToTypeMap[address] = 'SnipeBot';
      }

      if (project.addons.VolumeBot?.depositWalletId?.publicKey) {
        const address = project.addons.VolumeBot.depositWalletId.publicKey;
        depositWalletAddresses.push(address);
        walletToTypeMap[address] = 'VolumeBot';
      }

      if (project.addons.HolderBot?.depositWalletId?.publicKey) {
        const address = project.addons.HolderBot.depositWalletId.publicKey;
        depositWalletAddresses.push(address);
        walletToTypeMap[address] = 'HolderBot';
      }

      if (project.addons.AutoSellBot?.depositWalletId?.publicKey) {
        const address = project.addons.AutoSellBot.depositWalletId.publicKey;
        depositWalletAddresses.push(address);
        walletToTypeMap[address] = 'AutoSellBot';
      }

      // Fetch balances for all wallets at once
      if (depositWalletAddresses.length > 0) {
        const balancesArray = await getWeb3WalletBalances(
          depositWalletAddresses,
          project.tokenAddress
        );

        // Transform array into dictionary and update state
        const balances: WalletBalances = balancesArray.reduce(
          (acc, balance) => ({
            ...acc,
            [balance.address]: {
              bnbBalance: Number(balance.bnbBalance) || 0,
              tokenBalance: Number(balance.tokenAmount) || 0,
            },
          }),
          {}
        );

        setDepositWalletBalances(balances);
      }
    } catch (error) {
      console.error('Error refreshing wallet balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [project?.tokenAddress, project?.addons, toast]);

  // Add debug logging to the useEffect hook
  useEffect(() => {
    if (!project?.tokenAddress || initialBalancesFetched.current) return;

    memoizedRefreshWalletBalances();
    initialBalancesFetched.current = true;
  }, [project?.tokenAddress, memoizedRefreshWalletBalances]);

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
            generatedVolume:
              bot.generatedVolume || updatedAddOns[index].generatedVolume,
            generatedHolders:
              bot.generatedHolders || updatedAddOns[index].generatedHolders,
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
          updatedAddOns[index] = {
            ...updatedAddOns[index],
            depositWallet: bot.depositWalletId?.publicKey || '',
            generatedVolume:
              bot.generatedVolume || updatedAddOns[index].generatedVolume,
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
            generatedHolders:
              bot.generatedHolders || updatedAddOns[index].generatedHolders,
          };

          // Update config
          updatedConfigs['HolderBot'] = {
            ...updatedConfigs['HolderBot'],
            _id: bot._id,
            enabled: bot.isEnabled || false,
          };
        }
      }

      const bot = project.addons?.AutoSellBot;
      const index = updatedAddOns.findIndex(
        (addon) => addon.botType === 'AutoSellBot'
      );

      if (index !== -1 && bot) {
        updatedAddOns[index] = {
          ...updatedAddOns[index],
          depositWallet: bot.depositWalletId?.publicKey || '',
          countsOfActivaveWallets:
            bot.countsOfActivaveWallets ||
            updatedAddOns[index].countsOfActivaveWallets,
        };

        // Update config
        updatedConfigs['AutoSellBot'] = {
          ...updatedConfigs['AutoSellBot'],
          _id: bot._id,
          enabled: bot.isEnabled || false,
        };
      } else {
        console.warn(
          'AutoSellBot not found in addOns array or bot data is missing'
        );
      }

      // Update the state
      setAddOns(updatedAddOns);
      setConfigs(updatedConfigs);
    }
  }, [project]);

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
        const { title, message } = parseErrorMessage(
          data.error.message,
          data.error.details
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
            description: `Successfully generated ${data.generatedVolume.toFixed(2)} volume`,
            variant: 'default',
          });
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
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast({
        title: 'Connection Error',
        description:
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
  }, [projectId, dispatch, toast]);

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
    }) => {
      console.log('Received holder generation update:', data);
      if (data.error) {
        console.error('Holder generation error:', data.error);
        const { title, message } = parseErrorMessage(
          data.error.message,
          data.error.details
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
        if (data.generatedHolders > 0) {
          toast({
            title: 'Holders Generated',
            description: `Successfully generated ${data.generatedHolders} holders`,
            variant: 'default',
          });

          // Update the holder count in the UI
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
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast({
        title: 'Connection Error',
        description:
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

    if (botType === 'VolumeBot' && !currentEnabled) {
      setIsVolumeDialogOpen(true);
      return;
    }

    if (botType === 'HolderBot' && !currentEnabled) {
      try {
        // Update local state optimistically first
        const newConfigs = {
          ...configs,
          [botType]: { ...configs[botType], enabled: !currentEnabled },
        };
        setConfigs(newConfigs);

        await BotService.startHolderBot(
          configs[botType]._id,
          project?._id || projectId,
          project?.tokenAddress || '',
          project?.tokenDecimals || 18
        );

        toast({
          title: 'Holder Bot Started',
          description: 'Holder Bot has been started successfully',
        });
      } catch (err: any) {
        console.error('Error starting holder bot:', err);
        // Revert the optimistic update on error
        setConfigs((prev) => ({
          ...prev,
          [botType]: { ...prev[botType], enabled: currentEnabled },
        }));
        toast({
          title: 'Error',
          description: err?.message || 'Failed to start Holder Bot',
          variant: 'destructive',
        });
      }
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
          title: 'Error',
          description: error || 'Failed to toggle bot. Please try again.',
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
    setDialogStates(prev => ({
      ...prev,
      [addonType]: isOpen
    }));
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

  return (
    <div className="space-y-6">
      {!configs || typeof configs !== 'object' ? (
        <div>Loading...</div>
      ) : (
        <>
          <h2 className="text-xl font-bold">Add-Ons & Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-4">
            {addOns.map((addon) => {
              // Use the dialog state from the dialogStates object
              const isBnbDepositDialogOpen = dialogStates[addon.botType] || false;
              
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
                            setConfigs((prev) => ({
                              ...prev,
                              [addon.botType]: {
                                ...prev[addon.botType],
                                enabled: checked,
                              },
                            }));
                            handleToggle(addon.botType);
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
                                  href={`https://bscscan.com/address/${addon.depositWallet}`}
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
                                    } catch (error) {
                                      console.error(
                                        'Failed to download wallet:',
                                        error
                                      );
                                      toast({
                                        title: 'Download Failed',
                                        description:
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
                        <Label>BNB Balance</Label>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold">
                            {addon.depositWallet &&
                            depositWalletBalances[addon.depositWallet]
                              ? depositWalletBalances[
                                  addon.depositWallet
                                ].bnbBalance.toFixed(4)
                              : '0'}{' '}
                            BNB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => toggleDialog(addon.botType, true)}
                          >
                            Deposit
                          </Button>
                        </div>
                        <BnbDepositDialog
                          open={isBnbDepositDialogOpen}
                          onOpenChange={(open) => toggleDialog(addon.botType, open)}
                          depositWalletAddress={addon.depositWallet}
                        />
                      </div>
                    )}
                    {addon.botType === 'SnipeBot' && (
                      <div>
                        <Label>Token Balance</Label>
                        <p className="text-xl font-bold">
                          {addon.depositWallet &&
                          depositWalletBalances[addon.depositWallet]
                            ? depositWalletBalances[
                                addon.depositWallet
                              ].tokenBalance?.toFixed(2)
                            : '0'}{' '}
                          {project?.symbol || project.name}
                        </p>
                      </div>
                    )}
                    {addon.botType === 'VolumeBot' &&
                      addon.generatedVolume !== undefined && (
                        <div>
                          <Label>Generated Volume</Label>
                          <p className="text-xl font-bold">
                            ${formatNumber(addon.generatedVolume)}
                          </p>
                        </div>
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
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4 mt-auto">
                    {addon.botType === 'HolderBot'? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please deposit BNB to the wallet address above and
                          click Execute to start generating{' '}
                          {addon.botType === 'HolderBot' ? 'holders' : 'volume'}
                          .
                        </p>
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() =>
                            isProjectOwner
                              ? handleToggle(addon.botType)
                              : toast({
                                  title: 'Error',
                                  description:
                                    'You are not the owner of this project',
                                  variant: 'destructive',
                                })
                          }
                          disabled={!isProjectOwner}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {configs[addon.botType]?.enabled ? 'Stop' : 'Start'}
                        </Button>
                      </>
                    ) : addon.botType === 'AutoSellBot' ||
                      addon.botType === 'VolumeBot' ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          {addon.botType === 'AutoSellBot'
                            ? 'Please deposit BNB to the wallet address above and click Execute to start use Auto sell bot'
                            : 'Please deposit BNB to the wallet address above and click Execute to start generating volume.'}
                        </p>
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() =>
                            isProjectOwner
                              ? addon.botType === 'AutoSellBot'
                                ? setIsAutoSellDialogOpen(true)
                                : setIsVolumeDialogOpen(true)
                              : toast({
                                  title: 'Error',
                                  description:
                                    'You are not the owner of this project',
                                  variant: 'destructive',
                                })
                          }
                        >
                          Configure & Execute
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please deposit BNB to the wallet address above and
                          click Execute to start use sniping bot.
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
              <SnipeWizardDialog
                open={isSimulateDialogOpen}
                onOpenChange={setIsSimulateDialogOpen}
              />
            )}
          </Suspense>
          {/* <BundleSnipingDialog
            open={isSimulateDialogOpen}
            onOpenChange={setIsSimulateDialogOpen}
          /> */}{' '}
          {/* hide on going to production */}
          <Suspense fallback={null}>
            {isAutoSellDialogOpen && (
              <AutoSellWizardDialog
                open={isAutoSellDialogOpen}
                onOpenChange={setIsAutoSellDialogOpen}
                wallets={wallets}
                onWalletsChange={setWallets}
              />
            )}
          </Suspense>
          <Suspense fallback={null}>
            {isVolumeDialogOpen && (
              <VolumeBotWizardDialog
                open={isVolumeDialogOpen}
                onOpenChange={setIsVolumeDialogOpen}
              />
            )}
          </Suspense>
        </>
      )}
    </div>
  );
}
