'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { SnipeWizardDialog } from './snipe-wizard-dialog';
import {
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Save,
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, getBadgeVariant } from '@/lib/utils';
import { walletApi } from '@/services/walletApi';
import { getWalletBalances as getWeb3WalletBalances } from '@/services/web3Utils';
import { BotType, toggleBot } from '@/store/slices/botSlice';
import { AppDispatch, RootState } from '@/store/store';
import { ProjectWithAddons } from '@/types';

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

// Define types for the project data
type DepositWallet = {
  _id: string;
  publicKey: string;
  botType: string;
  role: string;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type BotData = {
  _id: string;
  isEnabled: boolean;
  projectId: string;
  userId: string;
  bnbBalance: number;
  estimatedFee: number;
  subWalletIds: any[];
  botType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  depositWalletId: DepositWallet;
  __v: number;
  tokenBalance?: number;
  generatedVolume?: number;
  generatedHolders?: number;
};

type ProjectAddons = {
  SnipeBot?: BotData;
  VolumeBot?: BotData;
  HolderBot?: BotData;
};

interface ProjectAddOnsProps {
  project?: ProjectWithAddons;
}

// Define the addon structure
type AddonType = {
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
};

// Initialize addOns with empty values
const initialAddOns: AddonType[] = [
  {
    botType: 'SnipeBot',
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
    botType: 'VolumeBot',
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
  const [configs, setConfigs] = useState<ConfigsType>(
    initialAddOns.reduce(
      (acc, addon) => ({
        ...acc,
        [addon.botType]: {
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
  const [editingBot, setEditingBot] = useState<string | null>(null);
  const [isSimulateDialogOpen, setIsSimulateDialogOpen] = useState(false);
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const botState = useSelector((state: RootState) => state.bots);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const initialBalancesFetched = useRef(false);
  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth);

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

      if (project.addons.SnipeBot?.depositWalletId?.publicKey) {
        depositWalletAddresses.push(
          project.addons.SnipeBot.depositWalletId.publicKey
        );
      }

      if (project.addons.VolumeBot?.depositWalletId?.publicKey) {
        depositWalletAddresses.push(
          project.addons.VolumeBot.depositWalletId.publicKey
        );
      }

      if (project.addons.HolderBot?.depositWalletId?.publicKey) {
        depositWalletAddresses.push(
          project.addons.HolderBot.depositWalletId.publicKey
        );
      }

      // Fetch balances for all wallets at once
      if (depositWalletAddresses.length > 0) {
        const balancesArray = await getWeb3WalletBalances(
          depositWalletAddresses,
          project.tokenAddress
        );

        // Transform array into dictionary
        const balances: WalletBalances = balancesArray.reduce(
          (acc, balance) => ({
            ...acc,
            [balance.address]: {
              bnbBalance: balance.bnbBalance,
              tokenBalance: balance.tokenAmount,
            },
          }),
          {}
        );

        // Update addOns with the new balances
        setAddOns((prevAddOns) => {
          const updatedAddOns = [...prevAddOns];

          updatedAddOns.forEach((addon, index) => {
            const walletAddress =
              project.addons[addon.botType as keyof typeof project.addons]
                ?.depositWalletId?.publicKey;

            if (walletAddress && balances[walletAddress]) {
              updatedAddOns[index] = {
                ...addon,
                balances: {
                  native: balances[walletAddress].bnbBalance || 0,
                  ...(addon.botType === 'SnipeBot'
                    ? { token: balances[walletAddress].tokenBalance || 0 }
                    : {}),
                },
              };
            }
          });

          return updatedAddOns;
        });
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
          updatedAddOns[index].depositWallet =
            bot.depositWalletId?.publicKey || '';

          // Update config
          updatedConfigs['SnipeBot'] = {
            ...updatedConfigs['SnipeBot'],
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
          updatedAddOns[index].depositWallet =
            bot.depositWalletId?.publicKey || '';

          // Update config
          updatedConfigs['VolumeBot'] = {
            ...updatedConfigs['VolumeBot'],
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
          updatedAddOns[index].depositWallet =
            bot.depositWalletId?.publicKey || '';

          // Update config
          updatedConfigs['HolderBot'] = {
            ...updatedConfigs['HolderBot'],
            enabled: bot.isEnabled || false,
          };
        }
      }

      // Update the state
      setAddOns(updatedAddOns);
      setConfigs(updatedConfigs);
    }
  }, [project]);

  const handleToggle = (id: string) => {
    if (!project?._id || !projectId) {
      toast({
        title: 'Error',
        description: 'Project ID is missing. Cannot toggle bot.',
        variant: 'destructive',
      });
      return;
    }

    // Get the current enabled state
    const currentEnabled = configs[id].enabled;

    // Update local state optimistically
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !currentEnabled },
    }));

    // Dispatch the toggle action to the Redux store
    dispatch(
      toggleBot({
        projectId: project?._id || projectId,
        botType: id as BotType,
        enabled: !currentEnabled,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: `Bot ${!currentEnabled ? 'Enabled' : 'Disabled'}`,
          description: `${addOns.find((addon) => addon.botType === id)?.name} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
        });
      })
      .catch((error) => {
        // Revert the optimistic update on error
        setConfigs((prev) => ({
          ...prev,
          [id]: { ...prev[id], enabled: currentEnabled },
        }));

        toast({
          title: 'Error',
          description: error || 'Failed to toggle bot. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const handleSave = (id: string) => {
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

  const handleSimulationResult = (success: boolean) => {
    setConfigs((prev) => ({
      ...prev,
      SnipeBot: {
        ...prev['SnipeBot'],
        status: success
          ? 'snipe_succeeded'
          : ('snipe_failed' as LiquidationSnipeBotStatus),
      },
    }));
    setIsSimulateDialogOpen(false);
    toast({
      title: success ? 'Sniping Succeeded' : 'Sniping Failed',
      description: success
        ? 'The sniping operation was successful. You can now migrate to Auto Sell Bot.'
        : 'The sniping operation failed. You can retry or adjust your parameters.',
      variant: success ? 'default' : 'destructive',
    });
  };

  const handleSaveAutoSell = (newConfig: { wallets: any[] }) => {
    setConfigs((prev) => ({
      ...prev,
      SnipeBot: { ...prev['SnipeBot'], wallets: newConfig.wallets },
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Add-Ons & Configuration</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={memoizedRefreshWalletBalances}
              disabled={isRefreshingBalances}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshingBalances ? 'animate-spin' : ''}`}
              />
              {isRefreshingBalances ? 'Refreshing...' : 'Refresh Balances'}
            </Button>
          </div>
          <div className="flex flex-row gap-6 overflow-x-auto pb-4">
            {addOns.map((addon) => (
              <Card key={addon.botType} className="w-full">
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
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${addon.botType}-toggle`}>Enable</Label>
                    <Switch
                      id={`${addon.botType}-toggle`}
                      checked={configs[addon.botType].enabled}
                      onCheckedChange={() =>
                        isProjectOwner && handleToggle(addon.botType)
                      }
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
                                  if (project.addons.SnipeBot.depositWalletId) {
                                    try {
                                      const publicKey =
                                        project.addons.SnipeBot.depositWalletId
                                          .publicKey;
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
                    </>
                  )}
                  {addon.balances && (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>BNB Balance</Label>
                        <p className="text-xl font-bold">
                          {typeof addon.balances.native === 'number'
                            ? addon.balances.native.toFixed(2)
                            : '0'}{' '}
                          BNB
                        </p>
                      </div>
                      {addon.botType === 'SnipeBot' &&
                        addon.balances.token !== undefined && (
                          <div>
                            <Label>Token Balance</Label>
                            <p className="text-xl font-bold">
                              {typeof addon.balances.token === 'number'
                                ? addon.balances.token
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
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                  {addon.botType === 'HolderBot' ||
                  addon.botType === 'VolumeBot' ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Please deposit BNB to the wallet address above and click
                        Execute to start generating{' '}
                        {addon.botType === 'HolderBot' ? 'holders' : 'volume'}.
                      </p>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        onClick={() =>
                          isProjectOwner && handleSave(addon.botType)
                        }
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Please deposit BNB to the wallet address above and click
                        Execute to start use sniping bot.
                      </p>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        // onClick={() => isProjectOwner && setIsSimulateDialogOpen(true)}
                        onClick={() => setIsSimulateDialogOpen(true)}
                      >
                        Simulate & Execute
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* <SimulateAndExecuteDialog
            open={isSimulateDialogOpen}
            onOpenChange={setIsSimulateDialogOpen}
            onSimulationResult={handleSimulationResult}
          /> */}
          <SnipeWizardDialog
            open={isSimulateDialogOpen}
            onOpenChange={setIsSimulateDialogOpen}
            onSimulationResult={handleSimulationResult}
          />
        </>
      )}
    </div>
  );
}
