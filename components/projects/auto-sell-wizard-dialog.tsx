'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { AutoSellNotification } from './auto-sell-notification';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { BotService } from '@/services/botService';
import { projectService } from '@/services/projectService';
import { getTokenPrice, getWalletBalances } from '@/services/web3Utils';
import { RootState } from '@/store/store';
import { ProjectState } from '@/types';
import { Project } from '@/types/project';

interface ExtendedProject extends Project {
  pairAddress?: string;
  addons: {
    AutoSellBot?: {
      _id?: string;
      isEnabled?: boolean;
      status:
        | 'ready_to_autosell'
        | 'auto_selling'
        | 'selling'
        | 'sell_failed'
        | 'sell_succeeded'
        | 'sold_all'
        | 'disabled';
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
    [key: string]: any;
  };
  totalSupply?: string;
  tokenAddress: string;
  symbol: string;
  isImported?: boolean;
  explorerUrl?: string;
}

enum WizardStep {
  INTRODUCTION = 0,
  WALLET_SETUP = 1,
  PRICE_CONFIGURATION = 2,
  EXECUTION = 3,
}

export interface WalletInfo {
  _id?: string;
  publicKey: string;
  role: string;
  bnbBalance?: number;
  tokenBalance?: number;
  targetPrice?: number;
  stopLoss?: string | '0';
  isSelectedForAutoSell?: boolean;
  sellPrice?: string | '0';
  enabled?: boolean;
}

interface AutoSellWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletInfo[];
  project?: Project;
  projectId?: string;
  tokenAddress?: string;
  onWalletsChange?: (wallets: WalletInfo[]) => void;
}

export function AutoSellWizardDialog({
  open,
  onOpenChange,
  wallets,
  onWalletsChange,
}: AutoSellWizardDialogProps) {
  const { id: projectIdFromParams } = useParams() as { id: string };
  const [currentStep, setCurrentStep] = useState(WizardStep.INTRODUCTION);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isMigratingWallets, setIsMigratingWallets] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string | '0'>('0');
  const [stopLoss, setStopLoss] = useState<string | '0'>('0');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { toast } = useToast();
  const { currentProject, loading: isProjectLoading } = useSelector(
    (state: RootState) => state.projects as ProjectState
  );

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const projectFetchRef = useRef<AbortController | null>(null);

  // Update project state when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setProject(currentProject as unknown as ExtendedProject);
    }
  }, [currentProject]);

  const lastBalanceUpdateRef = useRef<number>(0);
  const MIN_BALANCE_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between balance updates
  const balanceFetchInProgressRef = useRef(false);
  const [localWallets, setLocalWallets] = useState<WalletInfo[]>(
    wallets.map((w) => ({ ...w, enabled: false }))
  );
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number | null>(
    null
  );
  const [isTogglingBot, setIsTogglingBot] = useState(false);
  const statusRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const [isDistributingBNBs, setIsDistributingBNBs] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState<number>(0.001);
  const [isCollectingBnb, setIsCollectingBnb] = useState(false);

  useEffect(() => {
    if (open && project?.tokenAddress) {
      // Fetch price when modal opens
      fetchTokenPrice();
    }
  }, [open, project?.tokenAddress]);

  useEffect(() => {
    if (open && project?.tokenAddress) {
      // Fetch price when step changes
      fetchTokenPrice();
    }
  }, [currentStep]);

  const fetchTokenPrice = async () => {
    if (project?.tokenAddress) {
      try {
        const price = await getTokenPrice(
          project.tokenAddress,
          project.pairAddress
        );
        setCurrentTokenPrice(price);
      } catch (error) {
        console.error('Error fetching token price:', error);
        setCurrentTokenPrice(null);
      }
    }
  };

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(WizardStep.INTRODUCTION);
      setConfigLoaded(false);
    }
  }, [open]);

  // Fetch project data when dialog opens
  useEffect(() => {
    if (open && projectIdFromParams) {
      fetchAndFillDetailedProject(projectIdFromParams);
    }
    // Cleanup function to abort any ongoing requests when the dialog closes
    return () => {
      if (projectFetchRef.current) {
        projectFetchRef.current.abort();
      }
    };
  }, [open, projectIdFromParams]);

  const fetchAndFillDetailedProject = async (
    projectId: string | undefined,
    isStatusUpdateOnly = false
  ) => {
    if (!projectId || isLoadingProject) return;

    // For status updates, we want a lighter operation
    if (isStatusUpdateOnly && project?._id) {
      try {
        // Don't set the loading state for quick status updates
        const projectData = await projectService.getProject(projectId);

        // Only update the bot status portion of the project
        if (projectData?.addons?.AutoSellBot && project?.addons?.AutoSellBot) {
          // Create a safe update that preserves the existing structure
          setProject((prev) => {
            if (!prev) return null;

            // Create a shallow copy of the project
            const updatedProject = { ...prev };

            // Update only the status and isEnabled properties
            if (updatedProject.addons && updatedProject.addons.AutoSellBot) {
              updatedProject.addons = {
                ...updatedProject.addons,
                AutoSellBot: {
                  ...updatedProject.addons.AutoSellBot,
                  isEnabled: projectData.addons.AutoSellBot.isEnabled,
                  status: projectData.addons.AutoSellBot.status,
                },
              };
            }

            return updatedProject;
          });
        }

        return;
      } catch (error) {
        // Silently fail for status updates
        console.error('Error updating bot status:', error);
        return;
      }
    }

    // Regular full project fetch

    // Cancel any existing fetch request
    if (projectFetchRef.current) {
      projectFetchRef.current.abort();
    }

    // Create new abort controller for this request
    projectFetchRef.current = new AbortController();

    try {
      setIsLoadingProject(true);
      const projectData = await projectService.getProject(projectId);

      // Only update state if the component is still mounted and the request wasn't aborted
      if (projectFetchRef.current) {
        setProject(projectData as unknown as ExtendedProject);

        // Load auto-sell parameters if AutoSellBot exists and has an ID
        if (projectData?.addons?.AutoSellBot?._id) {
          await loadAutoSellParameters(projectData.addons.AutoSellBot._id);
        }

        if (projectData?.addons?.AutoSellBot?.subWalletIds?.length > 0) {
          // Fetch balances for existing wallets only if we have wallets
          const walletAddresses =
            projectData.addons.AutoSellBot.subWalletIds.map(
              (id: any) => id.publicKey
            );
          walletAddresses.push(
            projectData.addons.AutoSellBot.depositWalletId.publicKey
          );
          if (walletAddresses.length > 0) {
            // Preserve wallet configuration when fetching balances
            await fetchWalletBalancesPreservingConfig(walletAddresses);
          }
        }
      }
    } catch (error: unknown) {
      // Only show error if it's not an abort error
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name !== 'AbortError'
      ) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch project data. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingProject(false);
    }
  };

  // New function that fetches balances while preserving wallet configuration
  const fetchWalletBalancesPreservingConfig = async (addresses: string[]) => {
    if (
      !project?.tokenAddress ||
      !addresses.length ||
      balanceFetchInProgressRef.current
    )
      return;

    // check addresses array to see if it contains the deposit wallet address
    const containsDepositWallet = addresses.includes(
      project?.addons?.AutoSellBot?.depositWalletId?.publicKey || ''
    );
    // if not add it to the array
    if (!containsDepositWallet) {
      addresses.push(
        project?.addons?.AutoSellBot?.depositWalletId?.publicKey || ''
      );
    }
    try {
      balanceFetchInProgressRef.current = true;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastBalanceUpdateRef.current;

      if (timeSinceLastUpdate < MIN_BALANCE_UPDATE_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_BALANCE_UPDATE_INTERVAL - timeSinceLastUpdate)
        );
      }

      setIsLoadingBalances(true);

      const response = await getWalletBalances(addresses, project.tokenAddress);

      const updatedWallets = addresses.map((address) => {
        const balance = response.find(
          (b: any) => b.address.toLowerCase() === address.toLowerCase()
        );
        const existingWallet = localWallets.find(
          (w) => w.publicKey.toLowerCase() === address.toLowerCase()
        );

        // Make sure to carefully preserve all existing wallet configuration
        return {
          ...existingWallet, // Keep all existing properties first
          publicKey: address,
          role:
            address?.toLowerCase() ===
            project?.addons?.AutoSellBot?.depositWalletId?.publicKey?.toLowerCase()
              ? 'botmain'
              : 'botsub',
          _id: existingWallet?._id,
          bnbBalance: balance?.bnbBalance || 0,
          tokenBalance: balance?.tokenAmount || 0,
          // Explicitly preserve these configuration values
          sellPrice: existingWallet?.sellPrice || '0',
          stopLoss: existingWallet?.stopLoss || '0',
          enabled: existingWallet?.enabled ?? true,
        };
      });

      // Only update wallets if configuration is already loaded
      if (
        configLoaded ||
        localWallets.some((w) => w.sellPrice && w.sellPrice !== '0')
      ) {
        // If wallet configuration is loaded, update carefully to preserve it
        setLocalWallets((prev) => {
          // Create a map for quick lookup
          const updatedWalletsMap = new Map(
            updatedWallets.map((w) => [w.publicKey.toLowerCase(), w])
          );

          // Start with previous wallets to preserve configurations
          return prev.map((wallet) => {
            const updated = updatedWalletsMap.get(
              wallet.publicKey.toLowerCase()
            );
            if (updated) {
              // Return wallet with updated balances but preserve configuration
              return {
                ...wallet,
                bnbBalance: updated.bnbBalance,
                tokenBalance: updated.tokenBalance,
              };
            }
            return wallet;
          });
        });
      } else {
        // If no configuration loaded yet, just set the wallets
        setLocalWallets(updatedWallets);
      }

      lastBalanceUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalances(false);
      balanceFetchInProgressRef.current = false;
    }
  };

  // Load existing auto-sell parameters from the backend
  const loadAutoSellParameters = async (botId: string) => {
    try {
      setIsLoadingConfig(true);
      const response = await BotService.getAutoSellParameters(botId);

      if (response.success && response.data) {
        // Find the first wallet with settings for default global values
        const firstWalletWithSettings = response.data.wallets.find(
          (w) =>
            (w.sellPrice && w.sellPrice !== '0') ||
            (w.stopLoss && w.stopLoss !== '0')
        );

        // Set target price and stop loss from the first wallet with settings
        if (firstWalletWithSettings) {
          if (
            firstWalletWithSettings.sellPrice &&
            firstWalletWithSettings.sellPrice !== '0'
          ) {
            setTargetPrice(firstWalletWithSettings.sellPrice);
          }
          if (
            firstWalletWithSettings.stopLoss &&
            firstWalletWithSettings.stopLoss !== '0'
          ) {
            setStopLoss(firstWalletWithSettings.stopLoss);
          }
        }

        // Update local wallets with their individual configurations from the backend
        if (response.data.wallets.length > 0) {
          const updatedWallets = response.data.wallets.map((w) => {
            // Find existing wallet in localWallets
            const existingWallet = localWallets.find(
              (lw) => lw.publicKey.toLowerCase() === w.address.toLowerCase()
            );
            // Combine existing wallet with stored configuration
            // Make sure to preserve each wallet's unique sell price and stop loss
            return {
              ...existingWallet,
              publicKey: w.address,
              role: 'botsub',
              // Use the specific values for each wallet from the backend
              sellPrice: w.sellPrice,
              stopLoss: w.stopLoss,
              enabled: w.enabled,
              // Preserve any existing balance information
              bnbBalance: existingWallet?.bnbBalance || 0,
              tokenBalance: existingWallet?.tokenBalance || 0,
            } as WalletInfo;
          });
          updatedWallets.push({
            publicKey:
              project?.addons?.AutoSellBot?.depositWalletId?.publicKey || '',
            role: 'botmain',
            bnbBalance: 0,
            tokenBalance: 0,
          });
          // Replace localWallets with the updated wallets with their individual settings
          setLocalWallets(updatedWallets);
        }

        // Set flag to indicate configuration was loaded successfully
        setConfigLoaded(true);

        // Show success toast
        toast({
          title: 'Configuration Loaded',
          description: `Loaded existing configuration for ${response.data.wallets.length} wallets`,
        });
      }
    } catch (error) {
      console.error('Error loading auto-sell parameters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load existing auto-sell configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < WizardStep.EXECUTION) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > WizardStep.INTRODUCTION) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Address copied',
      description: 'Wallet address has been copied to clipboard',
    });
  };

  const handleMigrateWallets = async () => {
    if (!projectIdFromParams) return;

    try {
      setIsMigratingWallets(true);
      const { status, data: updatedProject } =
        await projectService.migrateSnipingWallets(projectIdFromParams);

      if (status === 'success') {
        toast({
          title: 'Success',
          description: 'Successfully migrated sniping wallets to AutoSellBot',
        });

        if (updatedProject?.project?.addons?.AutoSellBot?.subWalletIds) {
          const walletAddresses =
            updatedProject?.project?.addons.AutoSellBot.subWalletIds.map(
              (id: any) => id.publicKey
            );
          await fetchWalletBalancesPreservingConfig(walletAddresses);
        }
      }
    } catch (error) {
      console.error('Error migrating wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to migrate wallets',
        variant: 'destructive',
      });
    } finally {
      setIsMigratingWallets(false);
    }
  };

  const handleExecute = async () => {
    if (!project?.addons?.AutoSellBot || !project?._id) {
      toast({
        title: 'Error',
        description:
          'Cannot execute: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    const projectId = project._id as string;
    setExecutionSuccess(false);
    setIsExecuting(true);

    try {
      const result = await BotService.configureAutoSell({
        projectId,
        botId: project.addons.AutoSellBot._id as string,
        wallets: localWallets.map((w) => ({
          address: w.publicKey,
          sellPrice:
            w.sellPrice && w.sellPrice !== '0' ? w.sellPrice : targetPrice,
          stopLoss: w.stopLoss && w.stopLoss !== '0' ? w.stopLoss : stopLoss,
          enabled: w.enabled ?? true,
        })),
      });

      if (result.success) {
        setExecutionSuccess(true);
        toast({
          title: 'Success',
          description: 'AutoSell configuration applied successfully',
        });

        // Don't refresh balances here as it can overwrite configuration
        // Instead, do a full refresh to get updated parameters but keep the local state
        if (projectIdFromParams) {
          // Set a flag to avoid overwriting the wallet configuration
          // Just get the updated project status
          fetchAndFillDetailedProject(projectIdFromParams, true);
        }
      } else {
        // Handle specific error messages from the API
        if (result.error?.includes('stop loss must be lower than sell price')) {
          throw new Error(
            'Invalid price configuration: Stop loss must be lower than sell price and both must be positive'
          );
        } else if (result.error?.includes('price configuration')) {
          throw new Error(result.error || 'Execution failed');
        } else {
          throw new Error(result.error || 'Execution failed');
        }
      }
    } catch (error) {
      // Show user-friendly error message
      let errorMessage = 'Failed to configure AutoSell';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'error' in error
      ) {
        // Handle error object with 'error' property
        errorMessage = String(error.error);
      }

      toast({
        title: 'Configuration Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectAllWallets = (checked: boolean) => {
    setLocalWallets((prev) =>
      prev.map((w) => ({
        ...w,
        enabled: checked,
      }))
    );
  };

  const isAllWalletsSelected =
    localWallets.length > 0 && localWallets.every((w) => w.enabled);
  const isSomeWalletsSelected = localWallets.some((w) => w.enabled);

  // Toggle bot enabled status
  const toggleBotEnabled = async () => {
    if (!project?.addons?.AutoSellBot?._id) {
      toast({
        title: 'Error',
        description: 'Cannot toggle bot: Bot configuration missing',
        variant: 'destructive',
      });
      return;
    }

    setIsTogglingBot(true);

    try {
      // Get current bot status
      const isCurrentlyEnabled = !!project.addons.AutoSellBot.isEnabled;

      // Toggle bot status
      const result = await BotService.toggleBot(
        project.addons.AutoSellBot._id,
        !isCurrentlyEnabled
      );

      if (result) {
        toast({
          title: 'Success',
          description: `AutoSell bot ${!isCurrentlyEnabled ? 'enabled' : 'disabled'} successfully`,
        });

        // Refresh project data to get updated bot status
        if (projectIdFromParams) {
          fetchAndFillDetailedProject(projectIdFromParams, true);
        }
      }
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle bot status',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Set up periodic refresh when on execution step
  useEffect(() => {
    // Clear any existing interval
    if (statusRefreshIntervalRef.current) {
      clearInterval(statusRefreshIntervalRef.current);
    }

    // Only set up interval if the dialog is open and we're on execution step
    if (open && currentStep === WizardStep.EXECUTION && project?._id) {
      // Refresh every 15 seconds
      statusRefreshIntervalRef.current = setInterval(() => {
        // Refresh token price
        fetchTokenPrice();

        // Refresh project data to get updated bot status, using the lighter version
        if (projectIdFromParams) {
          fetchAndFillDetailedProject(projectIdFromParams, true);
        }
      }, 15000); // 15 seconds
    }

    // Clean up interval when component unmounts or conditions change
    return () => {
      if (statusRefreshIntervalRef.current) {
        clearInterval(statusRefreshIntervalRef.current);
      }
    };
  }, [open, currentStep, project?._id]);

  // Also clean up interval when dialog closes
  useEffect(() => {
    if (!open && statusRefreshIntervalRef.current) {
      clearInterval(statusRefreshIntervalRef.current);
    }
  }, [open]);

  const handleDistributeExtraBnb = async () => {
    if (distributeAmount <= 0) {
      toast({
        title: 'Recommendation',
        description: 'Please enter a valid amount to distribute',
        variant: 'default',
      });
      return;
    }
    try {
      const depositWallet = project?.addons?.AutoSellBot?.depositWalletId;
      if (!depositWallet) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      // Get selected wallets for distribution
      const selectedWallets = localWallets.filter((w) => w.enabled);
      if (!selectedWallets.length) {
        toast({
          title: 'Error',
          description: 'No wallets selected for distribution',
          variant: 'destructive',
        });
        return;
      }

      // Get wallet addresses
      const subWalletAddresses = selectedWallets.map((w) => w.publicKey);

      // Calculate the even distribution amount for each wallet
      const amounts = subWalletAddresses.map(() => distributeAmount);

      setIsDistributingBNBs(true);

      const response = await BotService.distributeBnb({
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId: project?.addons?.AutoSellBot?._id || '',
      });

      if (response.success?.success) {
        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [depositWallet.publicKey, ...subWalletAddresses];
          fetchWalletBalancesPreservingConfig(allAddresses);
        }, 3000);

        toast({
          title: 'Success',
          description: 'Extra BNB distributed successfully.',
        });
      } else {
        // Check for insufficient balance error
        if (response.success?.error?.includes('Insufficient wallet balance')) {
          const match = response.success.error.match(
            /Required: ~([\d.]+) BNB, Found: ([\d.]+) BNB/
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute Extra BNB. You need to deposit ${needed} BNB to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                response.success?.error ||
                response.message ||
                'Failed to distribute Extra BNB',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              response.success?.error ||
              response.message ||
              'Failed to distribute Extra BNB',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error distributing extra BNB:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to distribute extra BNB',
        variant: 'destructive',
      });
    } finally {
      setIsDistributingBNBs(false);
    }
  };

  const handleCollectBnb = async () => {
    try {
      setIsCollectingBnb(true);
      const depositWalletId = project?.addons?.AutoSellBot?.depositWalletId;
      if (!depositWalletId) {
        toast({
          title: 'Error',
          description: 'Deposit wallet not found',
          variant: 'destructive',
        });
        return;
      }

      const selectedWallets = localWallets
        .filter((w) => w.role != 'botmain')
        .filter(
          (wallet) =>
            wallet.enabled && wallet.bnbBalance && wallet.bnbBalance > 0.00002
        );

      if (selectedWallets.length === 0) {
        toast({
          title: 'Error',
          description: 'No wallets with sufficient balance selected',
          variant: 'destructive',
        });
        return;
      }

      await BotService.collectBnb({
        botId: project?.addons?.AutoSellBot?._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        targetWallet: depositWalletId.publicKey,
        projectId: project._id,
      });

      toast({
        title: 'Success',
        description: 'BNB collected successfully',
      });
      setTimeout(() => {
        fetchWalletBalancesPreservingConfig(
          localWallets.map((w) => w.publicKey)
        );
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to collect BNB',
        variant: 'destructive',
      });
    } finally {
      setIsCollectingBnb(false);
    }
  };

  const renderIntroductionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>AutoSell Configuration</CardTitle>
        <CardDescription>
          Configure automated selling conditions for your wallets to protect
          your investment.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-medium mb-2">How it works</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AutoSellBot allows you to set target prices and stop losses for
              your wallets. When the token price reaches your target price, the
              bot will automatically sell the specified percentage of tokens. If
              the price drops to your stop loss, the bot will sell to minimize
              losses.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWalletSetupStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Wallet Setup</CardTitle>
        <CardDescription>
          Import wallets from SnipeBot or configure existing wallets for
          auto-selling.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4">
          {localWallets.length === 0 ? (
            <div className="border rounded-lg p-4">
              <h3 className="text-base font-medium mb-2">
                Import SnipeBot Wallets
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can import your existing SnipeBot wallets to configure them
                for auto-selling.
              </p>
              <Button
                onClick={handleMigrateWallets}
                disabled={isMigratingWallets}
                className="w-full"
              >
                {isMigratingWallets ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Wallets from SnipeBot'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium">Wallet Balances</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    fetchWalletBalancesPreservingConfig(
                      localWallets.map((w) => w.publicKey)
                    )
                  }
                  disabled={isLoadingBalances}
                >
                  {isLoadingBalances ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Balances
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%]">No</TableHead>
                      <TableHead className="w-[40%]">Wallet Address</TableHead>
                      <TableHead className="text-right">BNB Balance</TableHead>
                      <TableHead className="text-right">
                        Token Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localWallets
                      .filter((w) => w.role != 'botmain')
                      .map((wallet, index) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell className="text-left">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-1">
                              {wallet.publicKey.slice(0, 6)}...
                              {wallet.publicKey.slice(-4)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(wallet.publicKey)
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {(wallet.bnbBalance || 0).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(wallet.tokenBalance || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPriceConfigurationStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Price Configuration</CardTitle>
        <CardDescription>
          Set target prices and stop losses for your wallets.
          {configLoaded && (
            <span className="ml-2 text-sm text-green-500">
              (Existing configuration loaded)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4">
          {/* Global Settings */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">Global Settings</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-sm font-medium">
                    {currentTokenPrice?.toFixed(12) || '0.00000000'} USD
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={fetchTokenPrice}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Set default target and stop-loss prices that will be applied to
              all wallets. Individual wallet settings below can override these
              global values.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetPrice">Target Price (USD)</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Enter target price"
                  disabled={isLoadingConfig}
                />
              </div>
              <div>
                <Label htmlFor="stopLoss">Stop Loss (USD)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Enter stop loss"
                  disabled={isLoadingConfig}
                />
              </div>
            </div>
          </div>

          {/* Extra BNB Distribution */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">Extra BNB Distribution</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">
                    Deposit Wallet BNB:
                  </span>
                  <span className="text-sm font-medium">
                    {(() => {
                      const depositWalletPublicKey =
                        project?.addons?.AutoSellBot?.depositWalletId
                          ?.publicKey;
                      if (!depositWalletPublicKey) return '0.0000 BNB';
                      const balance = localWallets.find(
                        (w) => w.publicKey === depositWalletPublicKey
                      )?.bnbBalance;
                      return `${balance?.toFixed(4) || '0.0000'} BNB`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Distribute extra BNB from your deposit wallet to selected wallets
              for future sell operations.
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="distributeAmount" className="whitespace-nowrap">
                  Amount per wallet:
                </Label>
                <Input
                  id="distributeAmount"
                  type="number"
                  value={distributeAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDistributeAmount(Number(e.target.value))
                  }
                  step="0.01"
                  min="0"
                  className="w-32"
                />
                <span className="text-sm">BNB</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDistributeExtraBnb}
                  disabled={
                    isLoadingConfig ||
                    !localWallets.some((w) => w.enabled) ||
                    isDistributingBNBs
                  }
                >
                  {isDistributingBNBs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Distributing...
                    </>
                  ) : (
                    'Distribute Extra BNB'
                  )}
                </Button>
                <Button
                  onClick={handleCollectBnb}
                  disabled={
                    isLoadingConfig ||
                    !localWallets.some((w) => w.enabled) ||
                    isCollectingBnb
                  }
                >
                  {isCollectingBnb ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    'Collect BNB'
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              💡 This is useful for providing BNB to wallets for future sell
              operations.
            </p>
          </div>

          {/* Wallet Settings */}
          <div className="border rounded-lg p-4">
            <div className="w-full flex justify-between items-center">
              <h3 className="text-base font-medium mb-4">Wallet Settings</h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  fetchWalletBalancesPreservingConfig(
                    localWallets.map((w) => w.publicKey)
                  )
                }
                disabled={isLoadingBalances || isLoadingConfig}
              >
                {isLoadingBalances || isLoadingConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Balances
              </Button>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Configure individual wallet settings. If left empty, the global
              target and stop-loss prices will be used. Enable/disable auto-sell
              for each wallet using the checkbox.
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Wallet</TableHead>
                    <TableHead className="text-left">BNB</TableHead>
                    <TableHead className="text-left">Token</TableHead>
                    <TableHead className="text-left">Sell Price</TableHead>
                    <TableHead className="text-left">Stop Loss</TableHead>
                    <TableHead className="w-[10%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>Select</span>
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
                          disabled={isLoadingConfig}
                        />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingConfig ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Loading wallet configuration...
                      </TableCell>
                    </TableRow>
                  ) : localWallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No wallets available. Go back to wallet setup to add
                        wallets.
                      </TableCell>
                    </TableRow>
                  ) : (
                    localWallets
                      .filter((w) => w.role != 'botmain')
                      .map((wallet, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono">
                                {wallet.publicKey.slice(0, 6)}...
                                {wallet.publicKey.slice(-4)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(wallet.publicKey)
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-left font-mono">
                            {(wallet.bnbBalance || 0).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-left font-mono">
                            {(wallet.tokenBalance || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                wallet.sellPrice && wallet.sellPrice !== '0'
                                  ? wallet.sellPrice
                                  : targetPrice
                              }
                              onChange={(e) =>
                                setLocalWallets((prev) =>
                                  prev.map((w) =>
                                    w.publicKey === wallet.publicKey
                                      ? { ...w, sellPrice: e.target.value }
                                      : w
                                  )
                                )
                              }
                              placeholder="Enter sell price"
                              className="h-8"
                              disabled={isLoadingConfig}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                wallet.stopLoss && wallet.stopLoss !== '0'
                                  ? wallet.stopLoss
                                  : stopLoss
                              }
                              onChange={(e) =>
                                setLocalWallets((prev) =>
                                  prev.map((w) =>
                                    w.publicKey === wallet.publicKey
                                      ? { ...w, stopLoss: e.target.value }
                                      : w
                                  )
                                )
                              }
                              placeholder="Enter stop loss"
                              className="h-8"
                              disabled={isLoadingConfig}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={wallet.enabled}
                              onCheckedChange={(checked) =>
                                setLocalWallets((prev) =>
                                  prev.map((w) =>
                                    w.publicKey === wallet.publicKey
                                      ? { ...w, enabled: checked === true }
                                      : w
                                  )
                                )
                              }
                              disabled={isLoadingConfig}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecutionStep = () => (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-2 sm:px-6 sm:pb-4">
        <CardTitle>Execution</CardTitle>
        <CardDescription>
          Review and apply your AutoSell configuration.
          {configLoaded && (
            <span className="ml-2 text-sm text-green-500">
              (Existing configuration loaded)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">Configuration Summary</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-sm font-medium">
                    {currentTokenPrice?.toFixed(12) || '0.00000000'} USD
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={fetchTokenPrice}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                {project?._id && (
                  <div className="ml-2">
                    <AutoSellNotification projectId={project._id} />
                  </div>
                )}
              </div>
            </div>

            {/* Display current bot status */}
            {project?.addons?.AutoSellBot && (
              <div className="mb-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Current Bot Status</h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        project.addons.AutoSellBot.isEnabled
                          ? ['auto_selling', 'selling', 'sold_all'].includes(
                              project.addons.AutoSellBot.status as string
                            )
                            ? 'success'
                            : project.addons.AutoSellBot.status ===
                                'sell_failed'
                              ? 'destructive'
                              : 'warning'
                          : 'secondary'
                      }
                    >
                      {project.addons.AutoSellBot.isEnabled
                        ? project.addons.AutoSellBot.status ===
                          'ready_to_autosell'
                          ? 'Ready'
                          : project.addons.AutoSellBot.status === 'auto_selling'
                            ? 'Monitoring'
                            : project.addons.AutoSellBot.status === 'selling'
                              ? 'Selling'
                              : project.addons.AutoSellBot.status ===
                                  'sell_succeeded'
                                ? 'Sold'
                                : project.addons.AutoSellBot.status ===
                                    'sell_failed'
                                  ? 'Failed'
                                  : project.addons.AutoSellBot.status ===
                                      'sold_all'
                                    ? 'Sold All'
                                    : project.addons.AutoSellBot.status ===
                                        'disabled'
                                      ? 'Disabled'
                                      : project.addons.AutoSellBot.status
                        : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {project.addons.AutoSellBot.isEnabled
                    ? ['auto_selling', 'selling'].includes(
                        project.addons.AutoSellBot.status as string
                      )
                      ? 'The AutoSell bot is currently active and monitoring token prices.'
                      : project.addons.AutoSellBot.status === 'sell_succeeded'
                        ? 'The AutoSell bot has successfully sold tokens.'
                        : project.addons.AutoSellBot.status === 'sold_all'
                          ? 'The AutoSell bot has successfully sold all tokens.'
                          : project.addons.AutoSellBot.status === 'sell_failed'
                            ? 'The AutoSell bot failed to sell tokens. Please check configurations.'
                            : 'The AutoSell bot is enabled and waiting for price conditions to be met.'
                    : 'The AutoSell bot is currently disabled. Enable and configure it to start automated selling.'}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground mb-4">
              Review your global and individual wallet settings. Individual
              wallet settings take precedence over global settings.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Price</Label>
                <p className="text-sm font-medium">{targetPrice} USD</p>
              </div>
              <div>
                <Label>Stop Loss</Label>
                <p className="text-sm font-medium">{stopLoss} USD</p>
              </div>
              <div>
                <Label>Enabled Wallets</Label>
                <p className="text-sm font-medium">
                  {localWallets.filter((w) => w.enabled).length} of{' '}
                  {localWallets.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="w-full flex justify-between items-center">
              <h3 className="text-base font-medium mb-4">Wallet Details</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {localWallets
                .filter((w) => w.role != 'botmain')
                .map((wallet, index) => (
                  <div
                    key={wallet.publicKey}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <Label>Wallet {index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">
                          {wallet.publicKey.slice(0, 6)}...
                          {wallet.publicKey.slice(-4)}
                        </code>
                        <Badge
                          variant={wallet.enabled ? 'default' : 'secondary'}
                        >
                          {wallet.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Sell Price</Label>
                      <p className="text-sm font-medium">
                        {wallet.sellPrice && wallet.sellPrice !== '0'
                          ? wallet.sellPrice
                          : targetPrice}{' '}
                        USD
                      </p>
                    </div>
                    <div>
                      <Label className="mt-2">Stop Loss</Label>
                      <p className="text-sm font-medium">
                        {wallet.stopLoss && wallet.stopLoss !== '0'
                          ? wallet.stopLoss
                          : stopLoss}{' '}
                        USD
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <Button
            onClick={handleExecute}
            disabled={isExecuting || localWallets.length === 0}
            className="w-full"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : executionSuccess ? (
              'Update Configuration'
            ) : (
              'Apply Configuration'
            )}
          </Button>

          {executionSuccess && (
            <div className="mt-2 text-center text-sm text-green-500">
              Configuration applied successfully! The bot is now monitoring your
              wallets.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.INTRODUCTION:
        return renderIntroductionStep();
      case WizardStep.WALLET_SETUP:
        return renderWalletSetupStep();
      case WizardStep.PRICE_CONFIGURATION:
        return renderPriceConfigurationStep();
      case WizardStep.EXECUTION:
        return renderExecutionStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>AutoSell Wizard</DialogTitle>
          <DialogDescription>
            Set up automated sell conditions for your sniping wallets to protect
            your investment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Left side - progress and navigation */}
          <div className="lg:w-64 lg:flex-shrink-0 mb-4 lg:mb-0">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  Step {currentStep + 1} of {WizardStep.EXECUTION + 1}
                </span>
                <span className="hidden sm:inline">
                  {
                    Object.keys(WizardStep).filter((key) => isNaN(Number(key)))[
                      currentStep
                    ]
                  }
                </span>
              </div>
              <Progress
                value={((currentStep + 1) / (WizardStep.EXECUTION + 1)) * 100}
              />
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={goToPreviousStep}
                disabled={currentStep === WizardStep.INTRODUCTION}
              >
                Previous
              </Button>
              <Button
                className="w-full"
                onClick={goToNextStep}
                disabled={currentStep === WizardStep.EXECUTION}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Right side - step content */}
          <div className="flex-1">{renderStepContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
