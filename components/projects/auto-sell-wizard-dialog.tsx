'use client';

import { useEffect, useRef, useState } from 'react';

import { AutoSellNotification } from './auto-sell-notification';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
} from 'lucide-react';
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
import { Project } from '@/types/project';

interface ExtendedProject extends Project {
  pairAddress: string;
  chainName: string;
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
  PRICE_CONFIGURATION,
  EXECUTION,
}

export interface WalletInfo {
  _id?: string;
  publicKey: string;
  role: string;
  nativeBalance?: number;
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
  _wallets: WalletInfo[];
  project?: Project;
  projectId?: string;
  tokenAddress?: string;
  _onWalletsChange?: (wallets: WalletInfo[]) => void;
  onConfigurationSuccess?: () => void;
}

export function AutoSellWizardDialog({
  open,
  onOpenChange,
  _wallets,
  _onWalletsChange,
  onConfigurationSuccess,
}: AutoSellWizardDialogProps) {
  const { id: projectIdFromParams } = useParams() as { id: string };
  const [currentStep, setCurrentStep] = useState(
    WizardStep.PRICE_CONFIGURATION
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string | '0'>('0');
  const [stopLoss, setStopLoss] = useState<string | '0'>('0');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { toast } = useToast();

  // Initialize project state
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const projectFetchRef = useRef<AbortController | null>(null);
  const lastBalanceUpdateRef = useRef<number>(0);
  const MIN_BALANCE_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between balance updates
  const balanceFetchInProgressRef = useRef(false);
  const [localWallets, setLocalWallets] = useState<WalletInfo[]>([]);
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number | null>(
    null
  );
  const statusRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const [isDistributingNative, setIsDistributingNative] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState<number>(0.001);
  const [isCollectingNative, setIsCollectingNative] = useState(false);
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

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
        setIsRefreshingPrice(true);
        const price = await getTokenPrice(
          project.tokenAddress,
          project.pairAddress,
          project.chainName || 'BSC_MAINNET'
        );
        setCurrentTokenPrice(price);
      } catch (error) {
        console.error('Error fetching token price:', error);
        setCurrentTokenPrice(null);
      } finally {
        setIsRefreshingPrice(false);
      }
    }
  };

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(WizardStep.PRICE_CONFIGURATION);
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
                  subWalletIds: projectData.addons.AutoSellBot.subWalletIds,
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
    } catch (error: any) {
      // Only show error if it's not an abort error
      console.error('Error fetching project:', error);
      toast({
        title: error.response?.data?.errorType || 'Project Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch project data. Please try again.',
        variant: 'destructive',
      });
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

      const response = await getWalletBalances(
        addresses,
        project.tokenAddress,
        project.chainName || 'BSC_MAINNET'
      );

      const updatedWallets = addresses.map((address) => {
        const balance = response.find(
          (b: any) => b.address.toLowerCase() === address.toLowerCase()
        );
        const existingWallet = localWallets.find(
          (w) => w.publicKey.toLowerCase() === address.toLowerCase()
        );

        // Make sure to carefully preserve all existing wallet configuration
        return typeof existingWallet?.enabled === 'boolean'
          ? {
              ...existingWallet, // Keep all existing properties first
              publicKey: address,
              role:
                address?.toLowerCase() ===
                project?.addons?.AutoSellBot?.depositWalletId?.publicKey?.toLowerCase()
                  ? 'botmain'
                  : 'botsub',
              _id: existingWallet?._id,
              nativeBalance: balance?.nativeBalance || 0,
              tokenBalance: balance?.tokenBalance || 0,
              // Explicitly preserve these configuration values
              sellPrice: existingWallet?.sellPrice || '0',
              stopLoss: existingWallet?.stopLoss || '0',
              enabled: existingWallet?.enabled,
            }
          : {
              ...existingWallet, // Keep all existing properties first
              publicKey: address,
              role:
                address?.toLowerCase() ===
                project?.addons?.AutoSellBot?.depositWalletId?.publicKey?.toLowerCase()
                  ? 'botmain'
                  : 'botsub',
              _id: existingWallet?._id,
              nativeBalance: balance?.nativeBalance || 0,
              tokenBalance: balance?.tokenBalance || 0,
              // Explicitly preserve these configuration values
              sellPrice: existingWallet?.sellPrice || '0',
              stopLoss: existingWallet?.stopLoss || '0',
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
                nativeBalance: updated.nativeBalance,
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
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Balance Fetch Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to fetch wallet balances',
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
          setLocalWallets((prevWallets) => {
            // Create a map of existing wallets for quick lookup
            const existingWalletsMap = new Map<string, WalletInfo>(
              prevWallets.map((w) => [w.publicKey.toLowerCase(), w])
            );

            // Update wallets with their configurations
            const updatedWallets = (response.data?.wallets || []).reduce<
              WalletInfo[]
            >((acc, w) => {
              const existingWallet = existingWalletsMap.get(
                w.address.toLowerCase()
              );
              if (existingWallet) {
                if (typeof existingWallet?.enabled === 'boolean') {
                  acc.push({
                    ...existingWallet,
                    sellPrice: w.sellPrice || '0',
                    stopLoss: w.stopLoss || '0',
                    enabled: w.enabled ?? true,
                  });
                } else {
                  acc.push({
                    ...existingWallet,
                    sellPrice: w.sellPrice || '0',
                    stopLoss: w.stopLoss || '0',
                  });
                }
              }
              return acc;
            }, []);

            // Add any wallets that weren't in the response but exist in prevWallets
            const configuredAddresses = new Set(
              (response.data?.wallets || []).map((w) => w.address.toLowerCase())
            );
            const remainingWallets = prevWallets.filter(
              (w) => !configuredAddresses.has(w.publicKey.toLowerCase())
            );

            return [...updatedWallets, ...remainingWallets];
          });
        }

        // Set flag to indicate configuration was loaded successfully
        setConfigLoaded(true);
      }
    } catch (error: any) {
      console.error('Error loading auto-sell parameters:', error);
      toast({
        title:
          error.response?.data?.errorType || 'Auto-Sell Configuration Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to load existing auto-sell configuration.',
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
    if (currentStep > WizardStep.PRICE_CONFIGURATION) {
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

    const isNoWalletSelected =
      localWallets.filter((w) => w.role === 'botsub').length === 0 ||
      localWallets.filter((w) => w.role === 'botsub').every((w) => !w.enabled);
    if (isNoWalletSelected) {
      toast({
        title: 'AutoSell Configuration Error',
        description: 'Please select at least one wallet to enable AutoSell',
        variant: 'destructive',
      });
      return;
    }

    const projectId = project._id as string;
    setExecutionSuccess(false);
    setIsExecuting(true);

    try {
      const walletsConfig = localWallets
        .filter((w) => w.role === 'botsub')
        .map((w) => ({
          address: w.publicKey,
          sellPrice:
            w.sellPrice && w.sellPrice !== '0' ? w.sellPrice : targetPrice,
          stopLoss: w.stopLoss && w.stopLoss !== '0' ? w.stopLoss : stopLoss,
          enabled: w.enabled ?? false,
        }));

      console.log('[handleExecute] walletsConfig', walletsConfig);

      const result = await BotService.configureAutoSell({
        projectId,
        botId: project.addons.AutoSellBot._id as string,
        wallets: walletsConfig,
      });

      if (result.success) {
        setExecutionSuccess(true);
        toast({
          title: 'Success',
          description: 'AutoSell configuration applied successfully',
        });

        // Call the success callback to enable the toggle
        onConfigurationSuccess?.();

        // Close the modal after successful configuration
        onOpenChange(false);

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
    } catch (error: any) {
      // Show user-friendly error message
      // let errorMessage = 'Failed to configure AutoSell';
      // if (error instanceof Error) {
      //   errorMessage = error.message;
      // } else if (
      //   typeof error === 'object' &&
      //   error !== null &&
      //   'error' in error
      // ) {
      //   // Handle error object with 'error' property
      //   errorMessage = String(error.error);
      // }

      toast({
        title: error.response?.data?.errorType || 'Configuration Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to configure AutoSell',
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

  const handleDistributeExtraNative = async () => {
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

      setIsDistributingNative(true);

      const response = await BotService.distributeNative({
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId: project?.addons?.AutoSellBot?._id || '',
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (response.success?.success) {
        // Refresh balances after distribution
        setTimeout(() => {
          const allAddresses = [depositWallet.publicKey, ...subWalletAddresses];
          fetchWalletBalancesPreservingConfig(allAddresses);
        }, 3000);

        toast({
          title: 'Success',
          description: `Extra ${nativeCurrency} distributed successfully.`,
        });
      } else {
        // Check for insufficient balance error
        if (response.success?.error?.includes('Insufficient wallet balance')) {
          const match = response.success.error.match(
            /Required: ~([\d.]+) , Found: ([\d.]+) /
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute Extra ${nativeCurrency}. You need to deposit ${needed} ${nativeCurrency} to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                response.success?.error ||
                response.message ||
                `Failed to distribute Extra ${nativeCurrency}`,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              response.success?.error ||
              response.message ||
              `Failed to distribute Extra ${nativeCurrency}`,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error(`Error distributing extra ${nativeCurrency}:`, error);
      toast({
        title:
          error.response.data.errorType ||
          `Extra ${nativeCurrency} Distribution Error`,
        description:
          error.response.data.errorMessage ||
          `Failed to distribute extra ${nativeCurrency}`,
        variant: 'destructive',
      });
    } finally {
      setIsDistributingNative(false);
    }
  };

  const handleCollectNative = async () => {
    try {
      setIsCollectingNative(true);
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
            wallet.enabled &&
            wallet.nativeBalance &&
            wallet.nativeBalance > 0.00002
        );

      if (selectedWallets.length === 0) {
        toast({
          title: 'Error',
          description: 'No wallets with sufficient balance selected',
          variant: 'destructive',
        });
        return;
      }

      await BotService.collectNative({
        botId: project?.addons?.AutoSellBot?._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        targetWallet: depositWalletId.publicKey,
        projectId: project._id,
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      toast({
        title: 'Success',
        description: `${nativeCurrency} collected successfully`,
      });
      setTimeout(() => {
        fetchWalletBalancesPreservingConfig(
          localWallets.map((w) => w.publicKey)
        );
      }, 3000);
    } catch (error: any) {
      toast({
        title:
          error.response.data.errorType || `Failed to collect native currency`,
        description: error.response.data.errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCollectingNative(false);
    }
  };

  // Update localWallets when project data changes
  useEffect(() => {
    if (project?.addons?.AutoSellBot) {
      const depositWallet = project.addons.AutoSellBot.depositWalletId;
      const subWallets = project.addons.AutoSellBot.subWalletIds;

      const newWallets: WalletInfo[] = [];

      // Add deposit wallet if it exists
      if (depositWallet) {
        newWallets.push({
          _id: depositWallet._id,
          publicKey: depositWallet.publicKey,
          role: 'botmain',
          nativeBalance: 0,
          tokenBalance: 0,
          sellPrice: '0',
          stopLoss: '0',
          enabled: false,
        });
      }

      // Add sub wallets
      subWallets.forEach((wallet) => {
        newWallets.push({
          _id: wallet._id,
          publicKey: wallet.publicKey,
          role: 'botsub',
          nativeBalance: 0,
          tokenBalance: 0,
          sellPrice: '0',
          stopLoss: '0',
          enabled: false,
        });
      });

      setLocalWallets(newWallets);

      // Fetch wallet balances
      const allAddresses = [
        ...(depositWallet ? [depositWallet.publicKey] : []),
        ...subWallets.map((w) => w.publicKey),
      ];
      fetchWalletBalancesPreservingConfig(allAddresses);
    }
  }, [project?.addons?.AutoSellBot]);

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
                  disabled={isRefreshingPrice}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRefreshingPrice ? 'animate-spin' : ''}`}
                  />
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

          {/* Extra native currency Distribution */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">
                Extra {nativeCurrency} Distribution
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">
                    Deposit Wallet {nativeCurrency}:
                  </span>
                  <span className="text-sm font-medium">
                    {(() => {
                      const depositWalletPublicKey =
                        project?.addons?.AutoSellBot?.depositWalletId
                          ?.publicKey;
                      if (!depositWalletPublicKey)
                        return `0.0000 ${nativeCurrency}`;
                      const balance = localWallets.find(
                        (w) => w.publicKey === depositWalletPublicKey
                      )?.nativeBalance;
                      return `${balance?.toFixed(4) || '0.0000'} ${nativeCurrency}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Distribute extra {nativeCurrency} from your deposit wallet to
              selected wallets for future sell operations.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 w-full">
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
                <span className="text-sm">{nativeCurrency}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  onClick={handleDistributeExtraNative}
                  disabled={
                    isLoadingConfig ||
                    !localWallets.some((w) => w.enabled) ||
                    isDistributingNative
                  }
                >
                  {isDistributingNative ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Distributing...
                    </>
                  ) : (
                    `Distribute Extra ${nativeCurrency}`
                  )}
                </Button>
                <Button
                  onClick={handleCollectNative}
                  disabled={
                    isLoadingConfig ||
                    !localWallets.some((w) => w.enabled) ||
                    isCollectingNative
                  }
                >
                  {isCollectingNative ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    `Collect ${nativeCurrency}`
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              💡 This is useful for providing {nativeCurrency} to wallets for
              future sell operations.
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
                        disabled={isLoadingConfig}
                      />
                    </TableHead>
                    <TableHead className="w-[20%]">Wallet</TableHead>
                    <TableHead className="text-left">
                      {nativeCurrency}
                    </TableHead>
                    <TableHead className="text-left">Token</TableHead>
                    <TableHead className="text-left">Sell Price</TableHead>
                    <TableHead className="text-left">Stop Loss</TableHead>
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
                            {(wallet.nativeBalance || 0).toFixed(4)}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
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
                  disabled={isRefreshingPrice}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRefreshingPrice ? 'animate-spin' : ''}`}
                  />
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
                  {
                    localWallets.filter((w) => w.enabled && w.role != 'botmain')
                      .length
                  }{' '}
                  of {localWallets.filter((w) => w.role != 'botmain').length}
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
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === WizardStep.PRICE_CONFIGURATION}
                className="h-9 px-2 sm:px-4 "
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                className="h-9 px-2 sm:px-4"
                onClick={goToNextStep}
                disabled={currentStep === WizardStep.EXECUTION}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-2" />
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
