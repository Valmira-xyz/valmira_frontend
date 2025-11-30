'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Copy, ExternalLink, Info, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisconnect } from 'wagmi';

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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getTokenPrice, getWalletBalances } from '@/services/web3Utils';
import { logout } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import type { ProjectWithAddons } from '@/types';

// Bot types supported by Valmira platform
const BOT_TYPES = [
  { value: 'SnipeBot', label: 'Snipe Bot' },
  { value: 'AutoSellBot', label: 'Auto Sell Bot' },
  { value: 'VolumeBot', label: 'Volume Bot' },
  { value: 'HolderBot', label: 'Holder Bot' },
  { value: 'DistributionBot', label: 'Distribution Bot' },
  { value: 'TrendingBot', label: 'Trending Bot' },
];

interface WalletInfo {
  _id?: string;
  publicKey: string;
  role: string;
  nativeBalance?: number;
  tokenBalance?: number;
  isSelectedForMutilSell?: boolean;
  sellPercentage?: number;
  nativeSpendRate?: number;
}

interface WalletManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithAddons;
}

export function WalletManagementModal({
  open,
  onOpenChange,
  project,
}: WalletManagementModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  // State management
  const [selectedBotType, setSelectedBotType] = useState<string>('SnipeBot');
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isCollectingNative, setIsCollectingNative] = useState(false);
  const [isExecutingMultiSell, setIsExecutingMultiSell] = useState(false);
  const [isExecutingMultiBuy, setIsExecutingMultiBuy] = useState(false);
  const [executingSingleSells, setExecutingSingleSells] = useState<
    Record<string, boolean>
  >({});
  const [executingSingleBuys, setExecutingSingleBuys] = useState<
    Record<string, boolean>
  >({});
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);
  const [isLoadingDepositWalletBalance, setIsLoadingDepositWalletBalance] =
    useState(false);
  const [extraDistributeNativeAmount, setExtraDistributeNativeAmount] =
    useState<number>(0.01);
  const [isDistributingNative, setIsDistributingNative] = useState(false);
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number | null>(
    null
  );
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);
  const [collectTargetWallet, setCollectTargetWallet] = useState<string>('');
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : project?.chainName === 'SOMNIA_TESTNET' ||
            project?.chainName === 'SOMNIA_MAINNET'
          ? 'SOMI'
          : 'SOL';

  // Computed values
  // const subWallets = wallets.filter((w) => w.role !== 'botmain');
  const selectableWallets = wallets; // All wallets are now selectable
  const isAllWalletsSelected =
    selectableWallets.length > 0 &&
    selectableWallets.every((w) => w.isSelectedForMutilSell);
  const isSomeWalletsSelected = selectableWallets.some(
    (w) => w.isSelectedForMutilSell
  );

  const handleDisconnect = async () => {
    try {
      await dispatch(logout());
      disconnect();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Fetch wallets for selected bot type
  const fetchWalletsForBot = async (botType: string) => {
    if (
      !project?.addons ||
      !project.addons[botType as keyof typeof project.addons]
    ) {
      setWallets([]);
      return;
    }

    setIsLoadingWallets(true);
    try {
      const botAddon = project.addons[
        botType as keyof typeof project.addons
      ] as any;
      const walletList: WalletInfo[] = [];

      // Add deposit wallet if it exists
      if (botAddon.depositWalletId?.publicKey) {
        walletList.push({
          _id: botAddon.depositWalletId._id,
          publicKey: botAddon.depositWalletId.publicKey,
          role: 'botmain',
          nativeBalance: 0,
          tokenBalance: 0,
          sellPercentage: 100,
          nativeSpendRate: 50,
        });
      }

      // Add sub wallets if they exist
      if (botAddon.subWalletIds && Array.isArray(botAddon.subWalletIds)) {
        botAddon.subWalletIds.forEach((wallet: any) => {
          walletList.push({
            _id: wallet._id,
            publicKey: wallet.publicKey,
            role: wallet.role || 'subwallet',
            nativeBalance: 0,
            tokenBalance: 0,
            sellPercentage: 100,
            nativeSpendRate: 50,
          });
        });
      }

      setWallets(walletList);

      // Automatically fetch balances after setting wallets, especially for sniping wallets
      if (walletList.length > 0) {
        const addresses = walletList.map((w) => w.publicKey);
        fetchBalances(addresses);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallets',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWallets(false);
    }
  };

  // Fetch balances for all wallets
  const fetchBalances = async (addresses: string[]) => {
    if (addresses.length === 0) return;

    setIsLoadingBalances(true);
    try {
      const balances = await getWalletBalances(
        addresses,
        project.tokenAddress,
        project.chainName
      );

      setWallets((prev) =>
        prev.map((wallet) => {
          const balance = balances.find(
            (b: any) => b.address === wallet.publicKey
          );
          return {
            ...wallet,
            nativeBalance: balance?.nativeBalance || 0,
            tokenBalance: balance?.tokenBalance || 0,
          };
        })
      );
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch wallet balances',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch deposit wallet balance
  const fetchDepositWalletBalance = async () => {
    if (!selectedBotType || !project?.addons) return;

    const botAddon = project.addons[
      selectedBotType as keyof typeof project.addons
    ] as any;
    if (!botAddon?.depositWalletId?.publicKey) return;

    setIsLoadingDepositWalletBalance(true);
    try {
      const balances = await getWalletBalances(
        [botAddon.depositWalletId.publicKey],
        project.tokenAddress,
        project.chainName
      );
      const balance = balances.find(
        (b: any) => b.address === botAddon.depositWalletId.publicKey
      );
      setDepositWalletBalance(balance?.nativeBalance || 0);
    } catch (error: any) {
      console.error('Error fetching deposit wallet balance:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      }
    } finally {
      setIsLoadingDepositWalletBalance(false);
    }
  };

  // Handle bot type selection
  const handleBotTypeChange = (botType: string) => {
    setSelectedBotType(botType);
    setWallets([]);
    setDepositWalletBalance(null);
    // Automatically fetch wallets for the new bot type, which will trigger balance loading
    fetchWalletsForBot(botType);
  };

  // Handle select all wallets
  const handleSelectAllWallets = (checked: boolean) => {
    setWallets((prev) =>
      prev.map((w) => ({
        ...w,
        isSelectedForMutilSell: checked, // All wallets can now be selected
      }))
    );
  };

  // Handle single sell
  const handleSingleSell = async (
    walletAddress: string,
    sellPercentage: number
  ) => {
    setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: true }));
    try {
      const result = await BotService.singleWalletSell({
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        sellPercentage,
        slippageTolerance: 99, // Max slippage tolerance
        targetWalletAddress:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?.depositWalletId?.publicKey,
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Tokens sold successfully',
        });
        // Refresh balances after successful sell
        const addresses = wallets.map((w) => w.publicKey);
        fetchBalances(addresses);
      } else {
        const errorMessage = result.error || 'Failed to sell tokens';
        let errorString = '';

        if (typeof errorMessage === 'string') {
          errorString = errorMessage;
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          const errorObj = errorMessage as unknown as {
            originalError?: string;
          };
          errorString = errorObj.originalError || String(errorMessage);
        }

        // Check for insufficient native balance error
        const insufficientNativeMatch = errorString.match(
          /balance for fees\. Required: ([\d.]+) , Available: ([\d.]+) /
        );

        // Check for PancakeRouter INSUFFICIENT_OUTPUT_AMOUNT error
        const insufficientOutputMatch = errorString.includes(
          'PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT'
        );

        if (insufficientNativeMatch) {
          const requiredNative = insufficientNativeMatch[1];
          const availableNative = insufficientNativeMatch[2];
          toast({
            title: 'Error',
            description: `Failed to sell tokens. You need ${requiredNative} ${nativeCurrency} in wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} for gas fees. Available: ${availableNative} ${nativeCurrency}`,
            variant: 'destructive',
          });
        } else if (insufficientOutputMatch) {
          toast({
            title: 'Transaction Failed',
            description:
              'The price impact is too high. Try selling a smaller amount.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Transaction Failed',
            description: errorString,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error in single sell:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to sell tokens',
          variant: 'destructive',
        });
      }
    } finally {
      setExecutingSingleSells((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  // Handle single buy
  const handleSingleBuy = async (walletAddress: string) => {
    setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: true }));
    try {
      // Find the wallet to get its nativeSpendRate
      const wallet = wallets.find((w) => w.publicKey === walletAddress);
      const nativeSpendRate = wallet?.nativeSpendRate || 50; // Default to 50% if not specified

      const result = await BotService.singleWalletBuy({
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        walletAddress,
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance: 99, // Max slippage tolerance
        targetWalletAddress: walletAddress,
        nativeSpendRate,
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Tokens bought successfully',
        });
        // Refresh balances after successful buy
        const addresses = wallets.map((w) => w.publicKey);
        fetchBalances(addresses);
      } else {
        const errorMessage = result.error || 'Failed to buy tokens';
        let errorString = '';

        if (typeof errorMessage === 'string') {
          errorString = errorMessage;
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          const errorObj = errorMessage as unknown as {
            originalError?: string;
          };
          errorString = errorObj.originalError || String(errorMessage);
        }

        const insufficientNativeMatch = errorString.match(
          /balance for fees\. Required: ([\d.]+) , Available: ([\d.]+) /
        );
        // Check for alternative insufficient funds error pattern
        const alternativeInsufficientMatch = errorString.match(
          /Insufficient funds for transaction\. Required: ([\d.]+) , Available: ([\d.]+) /i
        );

        if (insufficientNativeMatch || alternativeInsufficientMatch) {
          const match = insufficientNativeMatch || alternativeInsufficientMatch;
          const requiredNative = match![1];
          const availableNative = match![2];
          toast({
            title: 'Error',
            description: `Failed to buy tokens. You need ${requiredNative} ${nativeCurrency} in wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} for the transaction. Available: ${availableNative} ${nativeCurrency}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Transaction Failed',
            description: errorString,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error in single buy:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to buy tokens',
          variant: 'destructive',
        });
      }
    } finally {
      setExecutingSingleBuys((prev) => ({ ...prev, [walletAddress]: false }));
    }
  };

  // Handle multi sell
  const handleMultiSell = async () => {
    // Filter wallets that are selected for multi-sell and have token balance > 0
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.tokenBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Warning',
        description:
          'No wallets selected with sufficient token balance for multi-sell',
        variant: 'destructive',
      });
      return;
    }

    setIsExecutingMultiSell(true);
    try {
      const result = await BotService.multiWalletSell({
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        sellPercentages: selectedWallets.map((w) => w.sellPercentage || 100), // Default to 100% if not set
        slippageTolerance: 99, // Max slippage tolerance
        targetWalletAddress:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?.depositWalletId?.publicKey,
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Multi-sell operation completed successfully from ${selectedWallets.length} wallets`,
        });
        // Refresh balances after successful sell
        const addresses = wallets.map((w) => w.publicKey);
        fetchBalances(addresses);
      } else {
        const errorMessage = result.error || 'Multi-sell operation failed';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error in multi sell:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to execute multi-sell operation',
          variant: 'destructive',
        });
      }
    } finally {
      setIsExecutingMultiSell(false);
    }
  };

  // Handle multi buy
  const handleMultiBuy = async () => {
    // Filter wallets that are selected and have native balance > 0
    const selectedWallets = wallets.filter(
      (w) =>
        w.isSelectedForMutilSell &&
        w.role !== 'botmain' &&
        (w.nativeBalance || 0) > 0
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'Warning',
        description: `No wallets selected with sufficient ${nativeCurrency} balance for multi-buy`,
        variant: 'destructive',
      });
      return;
    }

    setIsExecutingMultiBuy(true);
    try {
      const result = await BotService.multiWalletBuy({
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project?.tokenAddress || '',
        slippageTolerance: 99, // Max slippage tolerance
        nativeSpendRates: selectedWallets.map((w) => w.nativeSpendRate || 50), // Default to 50% if not set
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Multi-buy operation completed successfully from ${selectedWallets.length} wallets`,
        });
        // Refresh balances after successful buy
        const addresses = wallets.map((w) => w.publicKey);
        fetchBalances(addresses);
      } else {
        const errorMessage = result.error || 'Multi-buy operation failed';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error in multi buy:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to execute multi-buy operation',
          variant: 'destructive',
        });
      }
    } finally {
      setIsExecutingMultiBuy(false);
    }
  };

  // Handle collect native
  const handleCollectNative = async () => {
    // Validate target wallet address
    if (!collectTargetWallet.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a target wallet address',
        variant: 'destructive',
      });
      return;
    }

    // Collect from all selected wallets (including deposit wallet) with sufficient balance
    const selectedWalletsWithBalance = wallets.filter(
      (w) => w.isSelectedForMutilSell && (w.nativeBalance || 0) > 0.000001
    );

    if (selectedWalletsWithBalance.length === 0) {
      toast({
        title: 'Warning',
        description:
          'No selected wallets with sufficient balance to collect from',
        variant: 'destructive',
      });
      return;
    }

    setIsCollectingNative(true);
    try {
      const result = await BotService.collectNative({
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        walletAddresses: selectedWalletsWithBalance.map((w) => w.publicKey),
        targetWallet: collectTargetWallet.trim(),
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `${nativeCurrency} collected from ${selectedWalletsWithBalance.length} selected wallets successfully`,
        });
        // Refresh balances after successful collection
        const addresses = wallets.map((w) => w.publicKey);
        fetchBalances(addresses);
      } else {
        const errorMessage =
          result.error || 'Failed to collect native currency';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error collecting native:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to collect native currency',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCollectingNative(false);
    }
  };

  // Fetch token price
  const fetchTokenPrice = async () => {
    if (!project?.tokenAddress) return;

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
  };

  // Handle distribute extra native
  const handleDistributeExtraNative = async () => {
    if (extraDistributeNativeAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount to distribute',
        variant: 'destructive',
      });
      return;
    }

    const depositWallet = wallets.find((w) => w.role === 'botmain');
    if (!depositWallet) {
      toast({
        title: 'Error',
        description: 'Deposit wallet not found',
        variant: 'destructive',
      });
      return;
    }

    // Get sub wallets for the selected bot type
    const subWallets = wallets.filter((w) => w.role !== 'botmain');
    if (subWallets.length === 0) {
      toast({
        title: 'Error',
        description: 'No sub wallets found',
        variant: 'destructive',
      });
      return;
    }

    setIsDistributingNative(true);
    try {
      // Calculate the even distribution amount for each wallet
      const subWalletAddresses = subWallets.map((w) => w.publicKey);
      const amounts = subWalletAddresses.map(() => extraDistributeNativeAmount);

      const result = await BotService.distributeNative({
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        amounts,
        projectId: project?._id || '',
        botId:
          project?.addons?.[selectedBotType as keyof typeof project.addons]
            ?._id || '',
        chainName: project?.chainName || 'BSC_MAINNET',
      });

      if (result?.success?.success) {
        toast({
          title: 'Success',
          description: `${nativeCurrency} distributed successfully to ${subWallets.length} wallets`,
        });
        // Refresh balances after distribution
        setTimeout(() => {
          const addresses = wallets.map((w) => w.publicKey);
          fetchBalances(addresses);
          fetchDepositWalletBalance();
        }, 1000);
      } else {
        // Check for insufficient balance error
        if (result?.success?.error?.includes('Insufficient wallet balance')) {
          const match = result?.success.error.match(
            /Required: ~([\d.]+) , Found: ([\d.]+) /
          );
          if (match) {
            const required = parseFloat(match[1]);
            const found = parseFloat(match[2]);
            const needed = (required - found).toFixed(6);
            toast({
              title: 'Insufficient Balance',
              description: `Failed to distribute ${nativeCurrency}. You need to deposit ${needed} ${nativeCurrency} to your deposit wallet and try again.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description:
                result?.success?.error ||
                result?.message ||
                `Failed to distribute ${nativeCurrency}`,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description:
              result?.success?.error ||
              result?.message ||
              `Failed to distribute ${nativeCurrency}`,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error distributing native:', error);
      if (error.response?.data?.errorType?.includes('jwt')) {
        handleDisconnect();
        router.push('/');
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.errorMessage?.toString().slice(0, 200) ||
            'Failed to distribute native currency',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDistributingNative(false);
    }
  };

  // Note: Wallet fetching is now handled directly in handleBotTypeChange
  // This useEffect is only needed for initial load when modal opens
  useEffect(() => {
    if (selectedBotType && wallets.length === 0) {
      fetchWalletsForBot(selectedBotType);
    }
  }, [selectedBotType, wallets.length]);

  // Note: Balance loading is now handled automatically in fetchWalletsForBot
  // when wallets are fetched or bot type changes

  // Fetch deposit wallet balance when bot type changes
  useEffect(() => {
    if (selectedBotType) {
      fetchDepositWalletBalance();
    }
  }, [selectedBotType]);

  // Fetch token price when modal opens or project changes
  useEffect(() => {
    if (open && project?.tokenAddress) {
      fetchTokenPrice();
    }
  }, [open, project?.tokenAddress]);

  // Set up 30-second interval for token price updates
  useEffect(() => {
    // Clear any existing interval
    if (priceUpdateIntervalRef.current) {
      clearInterval(priceUpdateIntervalRef.current);
    }

    // Set up new interval if modal is open and we have a project
    if (open && project?.tokenAddress) {
      priceUpdateIntervalRef.current = setInterval(() => {
        fetchTokenPrice();
      }, 30000); // 30 seconds
    }

    // Cleanup interval when modal closes or dependencies change
    return () => {
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
        priceUpdateIntervalRef.current = null;
      }
    };
  }, [open, project?.tokenAddress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:!max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wallet Management</DialogTitle>
          <CardDescription>
            Select a bot type to view and manage its associated wallets
          </CardDescription>
        </DialogHeader>

        <div className="mt-5 space-y-6">
          {/* Bot Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Bot Type</CardTitle>
              <div className="w-full flex justify-between">
                <CardDescription>
                  Choose which bot's wallets you want to manage
                </CardDescription>
                <Select
                  value={selectedBotType}
                  onValueChange={handleBotTypeChange}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Select a bot type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOT_TYPES.map((botType) => (
                      <SelectItem key={botType.value} value={botType.value}>
                        {botType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Wallet Management Section */}
          {selectedBotType && (
            <Card>
              <CardHeader>
                <CardTitle>Wallet Management</CardTitle>
                <CardDescription>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div>
                      Manage your wallets, sell tokens, and collect{' '}
                      {nativeCurrency}.
                    </div>

                    <div className="text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">
                          {currentTokenPrice !== null
                            ? `${project?.symbol} price:  $${currentTokenPrice?.toFixed(8)}`
                            : 'Loading...'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={fetchTokenPrice}
                          disabled={isRefreshingPrice}
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${isRefreshingPrice ? 'animate-spin' : ''}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Extra {nativeCurrency} Distribution */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-base font-medium mb-3">
                    Distribute Extra {nativeCurrency} (Recommended)
                  </h3>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Label
                        htmlFor="extraDistributeNativeAmount"
                        className="whitespace-nowrap text-sm"
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
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        {nativeCurrency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Deposit Balance:
                      </span>
                      <span className="text-sm font-medium">
                        {isLoadingDepositWalletBalance ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : depositWalletBalance !== null ? (
                          `${depositWalletBalance.toFixed(6)} ${nativeCurrency}`
                        ) : (
                          <span className="text-muted-foreground">
                            0 {nativeCurrency}
                          </span>
                        )}
                      </span>
                    </div>
                    <Button
                      className="bg-green-500 hover:bg-green-600 lg:w-auto"
                      onClick={handleDistributeExtraNative}
                      disabled={
                        !wallets.filter(
                          (wallet: WalletInfo) => wallet.role !== 'botmain'
                        ).length || isDistributingNative
                      }
                    >
                      {isDistributingNative
                        ? 'Distributing...'
                        : `Distribute Extra ${nativeCurrency}`}
                    </Button>
                  </div>

                  <div className="border border-green-400 rounded-md p-3 mt-4 text-green-700 text-sm">
                    <p>
                      💡 This is useful for providing {nativeCurrency} to
                      wallets for sell/buy operations
                    </p>
                  </div>
                </div>

                {/* Target Wallet for Collection */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-base font-medium mb-3">
                    {nativeCurrency} Collection Target Wallet
                  </h3>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Label
                        htmlFor="collectTargetWallet"
                        className="whitespace-nowrap text-sm"
                      >
                        Target wallet address:
                      </Label>
                      <Input
                        id="collectTargetWallet"
                        type="text"
                        value={collectTargetWallet}
                        onChange={(e) => setCollectTargetWallet(e.target.value)}
                        placeholder="Enter wallet address to collect BNB to..."
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="border border-blue-400 rounded-md p-3 mt-4 text-blue-700 text-sm">
                    <p>
                      📝 Enter the wallet address where you want to collect{' '}
                      {nativeCurrency} from selected wallets
                    </p>
                  </div>
                </div>
                {/* Wallet Table */}
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
                        .sort((a, b) => {
                          // Deposit wallet (botmain) first, then others
                          if (a.role === 'botmain' && b.role !== 'botmain')
                            return -1;
                          if (a.role !== 'botmain' && b.role === 'botmain')
                            return 1;
                          return 0;
                        })
                        .map((wallet, _index) => (
                          <React.Fragment key={wallet.publicKey}>
                            <TableRow
                              className={
                                wallet.role === 'botmain'
                                  ? 'bg-blue-50/10 '
                                  : ''
                              }
                            >
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
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
                                  {wallet.role === 'botmain' && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      Deposit
                                    </span>
                                  )}
                                </div>
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
                                        `https://${project?.chainName === 'BSC_MAINNET' ? 'bscscan.com' : project?.chainName === 'ETH_MAINNET' ? 'etherscan.io' : 'solscan.io'}/address/${wallet.publicKey}`,
                                        '_blank'
                                      )
                                    }
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {wallet.nativeBalance?.toFixed(4) || '0.000000'}
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
                                      ? 50
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
                            {/* Mobile token price row */}
                            <TableRow className="md:hidden border-t-0">
                              <TableCell
                                colSpan={8}
                                className="py-2 px-4 bg-muted/20"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Token Price:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {currentTokenPrice !== null
                                        ? `$${currentTokenPrice.toFixed(8)} USD`
                                        : 'Loading...'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={fetchTokenPrice}
                                      disabled={isRefreshingPrice}
                                    >
                                      <RefreshCw
                                        className={`h-3 w-3 ${isRefreshingPrice ? 'animate-spin' : ''}`}
                                      />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          <span className="text-sm text-muted-foreground">
                            {isLoadingWallets
                              ? 'Loading wallets...'
                              : selectedBotType
                                ? 'No wallets found for this bot type.'
                                : 'Select a bot type to view wallets.'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={() => {
                      const addresses = wallets.map((w) => w.publicKey);
                      fetchBalances(addresses);
                    }}
                    className="h-9"
                    variant="default"
                    disabled={isLoadingBalances || wallets.length === 0}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoadingBalances ? 'animate-spin' : ''}`}
                    />
                    {isLoadingBalances ? 'Refreshing...' : 'Refresh'}
                  </Button>

                  <Button
                    onClick={handleCollectNative}
                    className="h-9"
                    variant="default"
                    disabled={
                      isCollectingNative ||
                      isExecutingMultiSell ||
                      !collectTargetWallet.trim() ||
                      !wallets.some(
                        (w) =>
                          w.isSelectedForMutilSell &&
                          (w.nativeBalance || 0) > 0.000001
                      )
                    }
                  >
                    {isCollectingNative ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Collect {nativeCurrency}
                  </Button>

                  <Button
                    onClick={handleMultiSell}
                    disabled={
                      isExecutingMultiSell ||
                      isCollectingNative ||
                      !wallets.some(
                        (w) =>
                          w.isSelectedForMutilSell &&
                          w.role !== 'botmain' &&
                          (w.tokenBalance || 0) > 0
                      )
                    }
                    className="h-9"
                  >
                    {isExecutingMultiSell ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Multi Sell {project?.symbol || project?.name}
                  </Button>

                  <Button
                    onClick={handleMultiBuy}
                    disabled={
                      isExecutingMultiBuy ||
                      isCollectingNative ||
                      !wallets.some(
                        (w) =>
                          w.isSelectedForMutilSell &&
                          w.role !== 'botmain' &&
                          (w.nativeBalance || 0) > 0
                      )
                    }
                    className="h-9"
                    variant="default"
                  >
                    {isExecutingMultiBuy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Multi Buy {project?.symbol || project?.name}
                  </Button>
                </div>

                {/* Wallet Information */}
                {wallets.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-muted/5">
                      <h3 className="text-base font-medium mb-3">
                        Wallet Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Bot Type:
                          </span>{' '}
                          <span className="font-medium">
                            {BOT_TYPES.find(
                              (bt) => bt.value === selectedBotType
                            )?.label || selectedBotType}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Sub Wallets:
                          </span>{' '}
                          <span className="font-medium">
                            {wallets.filter((w) => w.role !== 'botmain').length}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Total Wallets:
                          </span>{' '}
                          <span className="font-medium">{wallets.length}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Total {nativeCurrency} Balance:
                          </span>{' '}
                          <span className="font-medium">
                            {wallets
                              .reduce(
                                (sum, w) => sum + (w.nativeBalance || 0),
                                0
                              )
                              .toFixed(6)}{' '}
                            {nativeCurrency}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Total Token Balance:
                          </span>{' '}
                          <span className="font-medium">
                            {wallets
                              .reduce(
                                (sum, w) => sum + (w.tokenBalance || 0),
                                0
                              )
                              .toLocaleString()}{' '}
                            Tokens
                          </span>
                        </p>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs text-blue-600 flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          Deposit wallet (shown as first row in table) funds are
                          used for gas fees during operations.
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/5">
                      <h3 className="text-base font-medium mb-3">
                        Instructions
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>
                          Refresh balances to see current token and{' '}
                          {nativeCurrency} amounts
                        </li>
                        <li>
                          Use "Buy" to purchase tokens from individual wallets
                        </li>
                        <li>
                          Set the sell percentage for each wallet (default:
                          100%)
                        </li>
                        <li>
                          Use "Single Sell" to sell from individual wallets
                        </li>
                        <li>
                          Check wallets (including deposit wallet) and use
                          "Multi Sell" to sell from multiple wallets at once
                        </li>
                        <li>
                          Set a target wallet address and select wallets to
                          collect {nativeCurrency} from
                        </li>
                        <li>
                          Use "Collect {nativeCurrency}" to transfer{' '}
                          {nativeCurrency} from selected wallets (including
                          deposit) to your target wallet
                        </li>
                        <li>
                          If there's insufficient {nativeCurrency}, use
                          "Distribute {nativeCurrency}" to transfer from deposit
                          to sub wallets
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
