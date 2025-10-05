'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { NativeDepositDialog } from '@/components/projects/native-deposit-dialog';
// import {
//   ChevronDown,
//   Download,
//   HelpCircle,
//   Pause,
//   Settings,
//   Users,
//   Wallet,
// } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { BotService } from '@/services/botService';
import { walletApi } from '@/services/walletApi';
import { getWalletBalances } from '@/services/web3Utils';
import { toggleBot } from '@/store/slices/botSlice';
import { fetchProject } from '@/store/slices/projectSlice';
import { generateWallets } from '@/store/slices/walletSlice';
import { AppDispatch } from '@/store/store';

// Add custom styles for the refresh animation
const styles = {
  refreshSpin: `[&>svg]:animate-spin`,
} as const;

// Interfaces
interface WalletInfo {
  _id?: string;
  publicKey: string;
  privateKey?: string;
  role: string;
  nativeBalance?: number;
  tokenBalance?: number;
  isSelected?: boolean;
  isSelectedForMutilSell?: boolean;
  sellPercentage?: number;
  nativeSpendRate?: number;
}

// Helper to shorten addresses – defined outside the component to avoid re-creation each render
function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Memoised table rows to avoid re-rendering unchanged rows
const SourceWalletRow = React.memo(function SourceWalletRow({
  wallet,
  showPrivateKeys,
  onSelect,
}: {
  wallet: WalletInfo;
  showPrivateKeys: boolean;
  onSelect: () => void;
}) {
  const { toast } = useToast();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Wallet address copied to clipboard',
    });
  };

  return (
    <TableRow key={wallet.publicKey}>
      <TableCell>
        <Checkbox
          checked={wallet.isSelected || false}
          onCheckedChange={onSelect}
          aria-label={`Select wallet ${formatAddress(wallet.publicKey)}`}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">
        <div className="flex items-center gap-2">
          {formatAddress(wallet.publicKey)}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(wallet.publicKey)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {formatAddress(wallet.publicKey)}
      </TableCell>
      {showPrivateKeys && (
        <TableCell className="font-mono text-sm">
          {wallet.privateKey ? formatAddress(wallet.privateKey) : 'N/A'}
        </TableCell>
      )}
      <TableCell>
        {wallet.tokenBalance?.toLocaleString() || '0'} tokens
      </TableCell>
    </TableRow>
  );
});
SourceWalletRow.displayName = 'SourceWalletRow';

const TargetWalletRow = React.memo(function TargetWalletRow({
  wallet,
  index: _index,
  onSelect,
}: {
  wallet: WalletInfo;
  index: number;
  onSelect: () => void;
}) {
  const { toast } = useToast();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Wallet address copied to clipboard',
    });
  };

  return (
    <TableRow key={wallet.publicKey}>
      <TableCell>
        <Checkbox
          checked={wallet.isSelected || false}
          onCheckedChange={onSelect}
          aria-label={`Select wallet ${formatAddress(wallet.publicKey)}`}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">
        <div className="flex items-center gap-2">
          {formatAddress(wallet.publicKey)}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(wallet.publicKey)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        {wallet.tokenBalance?.toLocaleString() || '0'} tokens
      </TableCell>
    </TableRow>
  );
});
TargetWalletRow.displayName = 'TargetWalletRow';

// Post-operation target wallet row
const PostOperationTargetWalletRow = React.memo(
  function PostOperationTargetWalletRow({
    wallet,
    project,
    nativeCurrency: _nativeCurrency,
    executingSingleSells,
    onSingleSell,
    onUpdateWallet,
    copyToClipboard,
  }: {
    wallet: WalletInfo;
    project: any;
    nativeCurrency: string;
    executingSingleSells: Record<string, boolean>;
    onSingleSell: (publicKey: string, sellPercentage: number) => Promise<void>;
    onUpdateWallet: (publicKey: string, updates: Partial<WalletInfo>) => void;
    copyToClipboard: (text: string) => void;
  }) {
    return (
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
              onUpdateWallet(wallet.publicKey, {
                isSelectedForMutilSell: checked === true,
              })
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
              onClick={() => copyToClipboard(wallet.publicKey)}
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
              wallet.sellPercentage === undefined ? 100 : wallet.sellPercentage
            }
            onChange={(e) =>
              onUpdateWallet(wallet.publicKey, {
                sellPercentage: Number(e.target.value),
              })
            }
          />
        </TableCell>
        <TableCell className="text-center">
          <Button
            className="h-8"
            onClick={() =>
              onSingleSell(wallet.publicKey, wallet.sellPercentage || 100)
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
        </TableCell>
      </TableRow>
    );
  }
);
PostOperationTargetWalletRow.displayName = 'PostOperationTargetWalletRow';

interface DistributionBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onConfigurationSuccess?: () => void;
}

export function DistributionBotDialog({
  open,
  onOpenChange,
  project,
  onConfigurationSuccess,
}: DistributionBotDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const _router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallet management state
  const [sourceWallets, setSourceWallets] = useState<WalletInfo[]>([]);
  const [targetWallets, setTargetWallets] = useState<WalletInfo[]>([]);
  const [targetWalletCount, setTargetWalletCount] = useState(10);
  const [sourceWalletType, setSourceWalletType] = useState<
    'sniping' | 'imported'
  >('sniping');
  const [showPrivateKeys, _setShowPrivateKeys] = useState(false);

  // Distribution settings
  const [distributionStyle, setDistributionStyle] = useState<
    'equal' | 'random'
  >('equal');
  const [minAmount, setMinAmount] = useState('100');
  const [maxAmount, setMaxAmount] = useState('1000');
  const [totalTokens, setTotalTokens] = useState('100000');

  const [useAllTokens, setUseAllTokens] = useState(true);

  // Time interval settings
  const [timeInterval, setTimeInterval] = useState(5); // seconds between transactions
  const [randomizeInterval, setRandomizeInterval] = useState(true);
  const [minInterval, _setMinInterval] = useState(3);
  const [maxInterval, _setMaxInterval] = useState(10);

  // UI state
  // const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [isGeneratingWallets, setIsGeneratingWallets] = useState(false);
  const [isImportingWallets, setIsImportingWallets] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);
  const [isDeletingWallets, setIsDeletingWallets] = useState(false);

  // Post-operation states
  const [_showPostOperation, _setShowPostOperation] = useState(false);
  const [executingSingleSells, setExecutingSingleSells] = useState<
    Record<string, boolean>
  >({});
  const [isExecutingMultiSell, setIsExecutingMultiSell] = useState(false);
  const [isCollectingNative, setIsCollectingNative] = useState(false);
  const [_isDistributingNative, _setIsDistributingNative] = useState(false);
  const [_extraDistributeNativeAmount, _setExtraDistributeNativeAmount] =
    useState(0.01);

  // Load existing distribution bot configuration
  const loadDistributionBotConfig = useCallback(() => {
    if (!project?.addons?.DistributionBot) return;

    const distributionBot = project.addons.DistributionBot;

    // Combine updates into a single object to minimise renders
    setDistributionStyle(distributionBot.distributionStyle?.type || 'equal');

    if (
      distributionBot.distributionStyle?.type === 'random' &&
      distributionBot.distributionStyle.randomAmount
    ) {
      setMinAmount(
        distributionBot.distributionStyle.randomAmount.min?.toString() || '100'
      );
      setMaxAmount(
        distributionBot.distributionStyle.randomAmount.max?.toString() || '1000'
      );
    } else if (
      distributionBot.distributionStyle?.type === 'equal' &&
      distributionBot.distributionStyle.equalAmount
    ) {
      // Prefer backend-provided wallet count – fallback to current state
      const walletCount =
        distributionBot.subWalletIds.filter(
          (wallet: any) => wallet.role === 'botsub_target'
        ).length || 0;
      setTotalTokens(
        (distributionBot.distributionStyle.equalAmount * walletCount).toString()
      );
      setUseAllTokens(false);
    }

    // Load time interval configuration
    if (distributionBot.timeSpanBetweenTransactions) {
      setRandomizeInterval(false);
      setTimeInterval(
        Math.floor(distributionBot.timeSpanBetweenTransactions / 1000) || 5
      );
    }

    // Load target wallets if they exist
    if (
      distributionBot.subWalletIds?.filter(
        (wallet: any) => wallet.role === 'botsub_target'
      ).length
    ) {
      setTargetWallets(
        distributionBot.subWalletIds
          .filter((wallet: any) => wallet.role === 'botsub_target')
          .map((wallet: any) => ({
            _id: wallet._id,
            publicKey: wallet.publicKey,
            role: wallet.role,
            tokenBalance: wallet.tokenBalance || 0,
            isSelected: false,
          }))
      );
      setTargetWalletCount(
        distributionBot.subWalletIds.filter(
          (wallet: any) => wallet.role === 'botsub_target'
        ).length
      );
    }

    // Load source wallets if they exist
    if (
      distributionBot.subWalletIds.filter(
        (wallet: any) => wallet.role !== 'botsub_target'
      ).length
    ) {
      setSourceWallets(
        distributionBot.subWalletIds
          .filter((wallet: any) => wallet.role !== 'botsub_target')
          .map((wallet: any) => ({
            _id: wallet._id,
            publicKey: wallet.publicKey,
            role: wallet.role,
            isSelected: wallet.isSelected || false,
            tokenBalance: wallet.tokenBalance || 0,
          }))
      );
    }
  }, [project]); // 👈 removed targetWallets.length to keep callback stable

  // --- 2️⃣ Stable callback for fetching balances ------------------------------
  const fetchSourceWalletBalances = useCallback(
    async (wallets: WalletInfo[]) => {
      if (!project?.tokenAddress || wallets.length === 0) return;

      setIsLoadingBalances(true);
      try {
        const walletAddresses = wallets.map((wallet) => wallet.publicKey);
        const balancesArray = await getWalletBalances(
          walletAddresses,
          project.tokenAddress,
          project.chainName
        );

        setSourceWallets((prev) =>
          prev.map((wallet) => {
            const balanceResult = balancesArray.find(
              (b: any) => b.address === wallet.publicKey
            );
            return balanceResult
              ? {
                  ...wallet,
                  tokenBalance: Number(balanceResult.tokenBalance) || 0,
                  nativeBalance: Number(balanceResult.nativeBalance) || 0,
                }
              : wallet;
          })
        );

        // Only show success toast when manually refreshed (not on auto-load)
        // toast({
        //   title: 'Success',
        //   description: 'Wallet balances updated successfully',
        // });
      } catch (error: any) {
        console.error('Error fetching wallet balances:', error);
        toast({
          title: error.response?.data?.errorType || 'Error',
          description:
            error.response?.data?.errorMessage ||
            'Failed to fetch wallet balances',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBalances(false);
      }
    },
    [project?.tokenAddress, project?.chainName, toast]
  );

  // Manual refresh function that shows success toast
  const handleManualRefresh = useCallback(async () => {
    if (!project?.tokenAddress || sourceWallets.length === 0) return;

    setIsLoadingBalances(true);
    try {
      const walletAddresses = sourceWallets.map((wallet) => wallet.publicKey);
      const balancesArray = await getWalletBalances(
        walletAddresses,
        project.tokenAddress,
        project.chainName
      );

      setSourceWallets((prev) =>
        prev.map((wallet) => {
          const balanceResult = balancesArray.find(
            (b: any) => b.address === wallet.publicKey
          );
          return balanceResult
            ? {
                ...wallet,
                tokenBalance: Number(balanceResult.tokenBalance) || 0,
                nativeBalance: Number(balanceResult.nativeBalance) || 0,
              }
            : wallet;
        })
      );

      toast({
        title: 'Success',
        description: 'Wallet balances updated successfully',
      });
    } catch (error: any) {
      console.error('Error fetching wallet balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to fetch wallet balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalances(false);
    }
  }, [project?.tokenAddress, project?.chainName, sourceWallets, toast]);

  console.log('[Distribution bot] project data', project);
  // Load sniping wallets as source wallets
  const loadSnipingWallets = useCallback(() => {
    if (!project?.addons?.SnipeBot) return;

    const snipeBotAddon = project.addons.SnipeBot;
    const wallets: WalletInfo[] = [];

    // // Add deposit wallet
    // if (snipeBotAddon.depositWalletId) {
    //   wallets.push({
    //     _id: snipeBotAddon.depositWalletId._id,
    //     publicKey: snipeBotAddon.depositWalletId.publicKey,
    //     role: 'source',
    //     isSelected: true,
    //   });
    // }

    // Add sub wallets
    snipeBotAddon.subWalletIds?.forEach((wallet: any) => {
      wallets.push({
        _id: wallet._id,
        publicKey: wallet.publicKey,
        role: 'botsub_source',
        isSelected: false,
        tokenBalance: wallet.tokenBalance || 0,
        nativeBalance: wallet.nativeBalance || 0,
      });
    });

    setSourceWallets(wallets);
  }, [project]);

  // Fetch balances when source wallets are loaded
  React.useEffect(() => {
    if (sourceWallets.length > 0 && project?.tokenAddress) {
      fetchSourceWalletBalances(sourceWallets); // pass snapshot
    }
  }, [sourceWallets.length, project?.tokenAddress]); // fetchSourceWalletBalances has stable reference

  // Generate target wallets
  const generateTargetWallets = async () => {
    if (!project?._id || !project?.addons?.SnipeBot?._id) {
      toast({
        title: 'Error',
        description: 'Project or SnipeBot not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingWallets(true);

      const generatedWallets = await dispatch(
        generateWallets({
          projectId: project._id,
          count: targetWalletCount,
          botId: project.addons.DistributionBot._id,
          role: 'botsub_target',
          botType: 'DistributionBot',
        })
      ).unwrap();

      const newTargetWallets: WalletInfo[] = generatedWallets.map((wallet) => ({
        _id: wallet._id,
        publicKey: wallet.publicKey,
        role: 'botsub_target',
        isSelected: false,
      }));

      setTargetWallets(newTargetWallets);

      toast({
        title: 'Success',
        description: `Generated ${targetWalletCount} target wallets`,
      });
    } catch (error: any) {
      console.error('Error generating target wallets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate target wallets',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingWallets(false);
    }
  };

  // Handle CSV import
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setIsImportingWallets(true);
        const content = e.target?.result as string;
        const lines = content.split('\n').filter((line) => line.trim());

        // Skip header if present
        const dataLines = lines[0].toLowerCase().includes('privatekey')
          ? lines.slice(1)
          : lines;

        const importedWallets: WalletInfo[] = [];

        dataLines.forEach((line) => {
          const [privateKey, publicKey] = line.split(',').map((s) => s.trim());

          if (privateKey && publicKey) {
            importedWallets.push({
              publicKey,
              privateKey,
              role: 'botsub_source',
              isSelected: false,
            });
          }
        });

        if (importedWallets.length === 0) {
          throw new Error('No valid wallet data found in CSV');
        }

        setSourceWallets(importedWallets);
        setSourceWalletType('imported');

        toast({
          title: 'Success',
          description: `Imported ${importedWallets.length} wallets from CSV`,
        });
      } catch (error: any) {
        console.error('Error importing CSV:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to import CSV file',
          variant: 'destructive',
        });
      } finally {
        setIsImportingWallets(false);
      }
    };

    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle wallet selection
  const handleWalletSelection = (
    publicKey: string,
    type: 'source' | 'target'
  ) => {
    if (type === 'source') {
      setSourceWallets((prev) =>
        prev.map((wallet) =>
          wallet.publicKey === publicKey
            ? { ...wallet, isSelected: !wallet.isSelected }
            : wallet
        )
      );
    } else if (type === 'target') {
      setTargetWallets((prev) =>
        prev.map((wallet) =>
          wallet.publicKey === publicKey
            ? { ...wallet, isSelected: !wallet.isSelected }
            : wallet
        )
      );
    }
  };

  // Handle select all wallets
  const handleSelectAllSourceWallets = (checked: boolean) => {
    setSourceWallets((prev) =>
      prev.map((wallet) => ({ ...wallet, isSelected: checked }))
    );
  };

  // Check if all source wallets are selected
  const areAllSourceWalletsSelected =
    sourceWallets.length > 0 && sourceWallets.every((w) => w.isSelected);
  const _areSomeSourceWalletsSelected = sourceWallets.some((w) => w.isSelected);

  // Handle select all target wallets
  const _handleSelectAllTargetWallets = (checked: boolean) => {
    setTargetWallets((prev) =>
      prev.map((wallet) => ({ ...wallet, isSelected: checked }))
    );
  };

  // Check if all target wallets are selected
  const _areAllTargetWalletsSelected =
    targetWallets.length > 0 && targetWallets.every((w) => w.isSelected);
  const _areSomeTargetWalletsSelected = targetWallets.some((w) => w.isSelected);

  // Delete selected target wallets
  const deleteSelectedTargetWallets = async () => {
    const selectedWallets = targetWallets.filter(
      (w) => w.isSelectedForMutilSell
    );

    if (selectedWallets.length === 0) {
      toast({
        title: 'No wallets selected',
        description: 'Please select wallets to delete',
        variant: 'destructive',
      });
      return;
    }

    if (!project?.addons?.DistributionBot?._id) {
      toast({
        title: 'Error',
        description: 'Distribution Bot not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeletingWallets(true);

      const walletAddresses = selectedWallets.map((w) => w.publicKey);

      await walletApi.deleteMultipleWallets(
        project.addons.DistributionBot._id,
        walletAddresses
      );

      // Remove deleted wallets from state
      setTargetWallets((prev) =>
        prev.filter(
          (wallet) =>
            !selectedWallets.some(
              (selected) => selected.publicKey === wallet.publicKey
            )
        )
      );

      // Refresh project data in Redux to sync with backend
      dispatch(fetchProject(project._id));

      toast({
        title: 'Success',
        description: `Deleted ${selectedWallets.length} wallet(s) successfully`,
      });
    } catch (error: any) {
      console.error('Error deleting wallets:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage || 'Failed to delete wallets',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingWallets(false);
    }
  };

  // Download all target wallets as CSV
  const downloadAllTargetWallets = async () => {
    if (targetWallets.length === 0) {
      toast({
        title: 'No wallets available',
        description: 'Please generate target wallets first',
        variant: 'destructive',
      });
      return;
    }

    if (!project?._id || !project?.addons?.DistributionBot?._id) {
      toast({
        title: 'Error',
        description: 'Project or Distribution Bot not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeletingWallets(true); // Reuse the loading state

      const blob = await walletApi.downloadAllWalletsAsCsv(
        project.addons.DistributionBot._id
      );

      // Create a URL for the blob and download it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `distribution_target_wallets_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Target wallets downloaded successfully',
      });
    } catch (error: any) {
      console.error('Error downloading wallets:', error);
      toast({
        title: error.response?.data?.errorType || 'Download Failed',
        description:
          error.response?.data?.errorMessage ||
          'Could not download wallets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingWallets(false);
    }
  };

  // --- 3️⃣ Memoised derived values -------------------------------------------
  const totalTokensFromSourceWallets = React.useMemo(() => {
    return sourceWallets
      .filter((w) => w.isSelected)
      .reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0);
  }, [sourceWallets]);

  const effectiveTotalTokens = React.useMemo(() => {
    return useAllTokens
      ? totalTokensFromSourceWallets
      : parseFloat(totalTokens || '0');
  }, [useAllTokens, totalTokens, totalTokensFromSourceWallets]);

  // Calculate distribution amounts
  const _calculateDistribution = () => {
    const _selectedSources = sourceWallets.filter((w) => w.isSelected);
    const totalAmount = effectiveTotalTokens;

    if (distributionStyle === 'equal') {
      const amountPerWallet = totalAmount / targetWallets.length;
      return targetWallets.map(() => amountPerWallet);
    } else {
      // Random distribution
      const min = parseFloat(minAmount);
      const max = parseFloat(maxAmount);
      const amounts: number[] = [];
      let remaining = totalAmount;

      for (let i = 0; i < targetWallets.length - 1; i++) {
        const maxPossible = Math.min(
          max,
          remaining - min * (targetWallets.length - i - 1)
        );
        const amount = Math.random() * (maxPossible - min) + min;
        amounts.push(amount);
        remaining -= amount;
      }

      // Last wallet gets remaining amount
      amounts.push(remaining);

      return amounts;
    }
  };

  // Start distribution
  const startDistribution = async () => {
    const _selectedSources = sourceWallets.filter((w) => w.isSelected);

    // if (selectedSources.length === 0) {
    //   toast({
    //     title: 'Error',
    //     description: 'Please select at least one source wallet',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    // if (targetWallets.length === 0) {
    //   toast({
    //     title: 'Error',
    //     description: 'Please generate target wallets first',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    // if (effectiveTotalTokens <= 0) {
    //   toast({
    //     title: 'Error',
    //     description: useAllTokens
    //       ? 'No tokens available in selected source wallets'
    //       : 'Please enter a valid token amount to distribute',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    // if (!project?.addons?.DistributionBot?._id) {
    //   toast({
    //     title: 'Error',
    //     description: 'Distribution Bot not found. Please check project configuration.',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    try {
      setIsDistributing(true);

      // Prepare configuration for the distribution bot according to backend schema
      const config = {
        isEnabled: true,
        status: 'Active' as const,
        subWalletIds: [
          ...targetWallets.map((wallet) => wallet._id),
          ...sourceWallets.map((wallet) => wallet._id),
        ],
        distributionStyle: {
          type: distributionStyle,
          ...(distributionStyle === 'random'
            ? {
                randomAmount: {
                  min: parseFloat(minAmount) || 0,
                  max: parseFloat(maxAmount) || 0,
                },
              }
            : {
                equalAmount: effectiveTotalTokens / targetWallets.length || 0,
              }),
        },
        timeSpanBetweenTransactions: randomizeInterval
          ? maxInterval * 1000
          : timeInterval * 1000,
        totalDistributions: effectiveTotalTokens,
      };

      console.log('[distribution bot]config', config);

      // Configure the distribution bot
      const result = await BotService.configureDistributionBot({
        projectId: project._id,
        botId: project.addons.DistributionBot._id,
        config: config,
      });

      if (result.status === 'success') {
        // Refresh project data
        setTimeout(() => {
          dispatch(fetchProject(project._id));
        }, 500);

        toast({
          title: 'Success',
          description:
            'Distribution Bot configuration applied and started successfully',
        });

        // Call the success callback to enable the toggle
        onConfigurationSuccess?.();

        // Close the modal after successful configuration
        onOpenChange(false);
      } else {
        throw new Error(result.message || 'Configuration failed');
      }
    } catch (error: any) {
      console.error('Error starting distribution:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          error.message ||
          'Failed to start distribution',
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Stop distribution
  const stopDistribution = async () => {
    if (!project?.addons?.DistributionBot?._id) {
      toast({
        title: 'Error',
        description: 'Cannot stop: Distribution Bot not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDistributing(true);

      // Disable the bot through Redux
      await dispatch(
        toggleBot({
          projectId: project._id,
          botId: project.addons.DistributionBot._id,
          enabled: false,
        })
      ).unwrap();

      // Refresh project data
      await dispatch(fetchProject(project._id));

      toast({
        title: 'Success',
        description: 'Distribution Bot stopped successfully',
      });
    } catch (error: any) {
      console.error('Error stopping distribution:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          error.message ||
          'Failed to stop distribution',
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Initialize with sniping wallets when dialog opens
  React.useEffect(() => {
    if (open && sourceWalletType === 'sniping') {
      loadSnipingWallets();
    }
  }, [open, sourceWalletType, loadSnipingWallets]);

  // Initialize with existing distribution bot config when dialog opens
  React.useEffect(() => {
    if (open) {
      loadDistributionBotConfig();
      // Remove automatic balance fetching to prevent infinite loop
      // Users can manually refresh balances using the refresh button
    }
  }, [open, loadDistributionBotConfig]);

  // Get native currency based on chain
  const nativeCurrency =
    project?.chainName === 'BSC_MAINNET'
      ? 'BNB'
      : project?.chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

  // Get distribution bot deposit wallet
  const depositWallet = project?.addons?.DistributionBot?.depositWalletId;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Wallet address copied to clipboard',
    });
  };

  // Add the function to fetch deposit wallet balance
  const fetchDepositWalletBalance = useCallback(async () => {
    if (!depositWallet?.publicKey || !project?.tokenAddress) return;

    try {
      const balancesArray = await getWalletBalances(
        [depositWallet.publicKey],
        project.tokenAddress,
        project.chainName
      );

      const balance = balancesArray.find(
        (b) => b.address === depositWallet.publicKey
      );
      if (balance) {
        setDepositWalletBalance(Number(balance.nativeBalance) || 0);
      }
    } catch (error: any) {
      console.error('Error fetching deposit wallet balance:', error);
    }
  }, [depositWallet?.publicKey, project?.tokenAddress, project?.chainName]);

  // Add the function to fetch target wallet balances
  const fetchTargetWalletBalances = useCallback(async () => {
    if (!project?.tokenAddress || targetWallets.length === 0) return;

    try {
      const targetWalletAddresses = targetWallets.map(
        (wallet) => wallet.publicKey
      );
      const balancesArray = await getWalletBalances(
        targetWalletAddresses,
        project.tokenAddress,
        project.chainName
      );

      // Update target wallets with new balances
      setTargetWallets((prev) =>
        prev.map((wallet) => {
          const balanceResult = balancesArray.find(
            (b) => b.address === wallet.publicKey
          );
          return balanceResult
            ? {
                ...wallet,
                tokenBalance: Number(balanceResult.tokenBalance) || 0,
                nativeBalance: Number(balanceResult.nativeBalance) || 0,
              }
            : wallet;
        })
      );
    } catch (error: any) {
      console.error('Error fetching target wallet balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to fetch target wallet balances',
        variant: 'destructive',
      });
    }
  }, [targetWallets, project?.tokenAddress, project?.chainName, toast]);

  // Fetch deposit wallet balance when dialog opens
  React.useEffect(() => {
    if (open && depositWallet?.publicKey) {
      fetchDepositWalletBalance();
    }
  }, [open, fetchDepositWalletBalance]);

  // Fetch target wallet balances when dialog opens or target wallets change
  React.useEffect(() => {
    if (open && targetWallets.length > 0 && project?.tokenAddress) {
      fetchTargetWalletBalances();
    }
  }, [
    open,
    targetWallets.length,
    project?.tokenAddress,
    fetchTargetWalletBalances,
  ]);

  // Update wallet helper function
  const updateTargetWallet = useCallback(
    (publicKey: string, updates: Partial<WalletInfo>) => {
      setTargetWallets((prev) =>
        prev.map((wallet) =>
          wallet.publicKey === publicKey ? { ...wallet, ...updates } : wallet
        )
      );
    },
    []
  );

  // Handle wallet selection for multi-operations
  const _handleMultiSelectWallet = useCallback(
    (publicKey: string, checked: boolean) => {
      updateTargetWallet(publicKey, { isSelectedForMutilSell: checked });
    },
    [updateTargetWallet]
  );

  // Handle select all for multi-operations
  const handleSelectAllForMultiOperations = useCallback((checked: boolean) => {
    setTargetWallets((prev) =>
      prev.map((wallet) => ({ ...wallet, isSelectedForMutilSell: checked }))
    );
  }, []);

  // Check selection states for multi-operations
  const isAllWalletsSelectedForMulti =
    targetWallets.length > 0 &&
    targetWallets.every((w) => w.isSelectedForMutilSell);
  const _isSomeWalletsSelectedForMulti = targetWallets.some(
    (w) => w.isSelectedForMutilSell
  );

  // Single sell operation
  const handleSingleSell = useCallback(
    async (publicKey: string, sellPercentage: number) => {
      if (!project?._id) return;

      setExecutingSingleSells((prev) => ({ ...prev, [publicKey]: true }));

      try {
        const result = await BotService.singleWalletSell({
          projectId: project._id,
          botId: project.addons.DistributionBot._id,
          walletAddress: publicKey,
          tokenAddress: project.tokenAddress,
          sellPercentage,
          slippageTolerance: 10,
          chainName: project.chainName,
        });

        if (result.status === 'success') {
          toast({
            title: 'Success',
            description: `Sold ${sellPercentage}% of tokens from wallet`,
          });

          // Refresh balances
          const balancesArray = await getWalletBalances(
            [publicKey],
            project.tokenAddress,
            project.chainName
          );

          const balance = balancesArray.find((b) => b.address === publicKey);
          if (balance) {
            updateTargetWallet(publicKey, {
              tokenBalance: Number(balance.tokenBalance) || 0,
              nativeBalance: Number(balance.nativeBalance) || 0,
            });
          }
        }
      } catch (error: any) {
        console.error('Error in single sell:', error);
        toast({
          title: error.response?.data?.errorType || 'Error',
          description:
            error.response?.data?.errorMessage || 'Failed to sell tokens',
          variant: 'destructive',
        });
      } finally {
        setExecutingSingleSells((prev) => ({ ...prev, [publicKey]: false }));
      }
    },
    [project, toast, updateTargetWallet]
  );

  // Multi sell operation
  const handleMultiSell = useCallback(async () => {
    if (!project?._id) return;

    const selectedWallets = targetWallets.filter(
      (w) => w.isSelectedForMutilSell
    );
    if (selectedWallets.length === 0) {
      toast({
        title: 'No wallets selected',
        description: 'Please select wallets for multi-sell operation',
        variant: 'destructive',
      });
      return;
    }

    setIsExecutingMultiSell(true);

    try {
      const result = await BotService.multiWalletSell({
        projectId: project._id,
        botId: project.addons.DistributionBot._id,
        walletAddresses: selectedWallets.map((w) => w.publicKey),
        tokenAddress: project.tokenAddress,
        sellPercentages: selectedWallets.map((w) => w.sellPercentage || 100),
        slippageTolerance: 10,
        chainName: project.chainName,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Multi-sell completed for ${selectedWallets.length} wallets`,
        });

        // Refresh balances for all selected wallets
        const addresses = selectedWallets.map((w) => w.publicKey);
        const balancesArray = await getWalletBalances(
          addresses,
          project.tokenAddress,
          project.chainName
        );

        balancesArray.forEach((balance) => {
          updateTargetWallet(balance.address, {
            tokenBalance: Number(balance.tokenBalance) || 0,
            nativeBalance: Number(balance.nativeBalance) || 0,
          });
        });
      }
    } catch (error: any) {
      console.error('Error in multi sell:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage || 'Failed to execute multi-sell',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMultiSell(false);
    }
  }, [project, targetWallets, toast, updateTargetWallet]);

  // Collect native currency
  const handleCollectNative = useCallback(async () => {
    if (!project?._id || !project?.addons?.DistributionBot?._id) return;

    setIsCollectingNative(true);

    try {
      const depositWallet = project.addons.DistributionBot.depositWalletId;
      if (!depositWallet) {
        throw new Error('Deposit wallet not found');
      }

      const result = await BotService.collectNative({
        botId: project.addons.DistributionBot._id,
        walletAddresses: targetWallets.map((w) => w.publicKey),
        targetWallet: depositWallet.publicKey,
        projectId: project._id,
        chainName: project.chainName,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Native currency collected successfully',
        });

        // Refresh all balances
        const addresses = targetWallets.map((w) => w.publicKey);
        const balancesArray = await getWalletBalances(
          addresses,
          project.tokenAddress,
          project.chainName
        );

        balancesArray.forEach((balance) => {
          updateTargetWallet(balance.address, {
            tokenBalance: Number(balance.tokenBalance) || 0,
            nativeBalance: Number(balance.nativeBalance) || 0,
          });
        });

        // Also refresh deposit wallet balance
        fetchDepositWalletBalance();
      }
    } catch (error: any) {
      console.error('Error collecting native:', error);
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage ||
          'Failed to collect native currency',
        variant: 'destructive',
      });
    } finally {
      setIsCollectingNative(false);
    }
  }, [
    project,
    targetWallets,
    toast,
    updateTargetWallet,
    fetchDepositWalletBalance,
  ]);

  // Distribute extra native currency
  // const handleDistributeExtraNative = useCallback(async () => {
  //   if (!project?._id || !project?.addons?.DistributionBot?._id) return;

  //   setIsDistributingNative(true);

  //   try {
  //     const depositWallet = project.addons.DistributionBot.depositWalletId;
  //     if (!depositWallet) {
  //       throw new Error('Deposit wallet not found');
  //     }

  //     const result = await BotService.distributeNative({
  //       depositWallet: depositWallet.publicKey,
  //       subWallets: targetWallets.map(w => w.publicKey),
  //       amounts: targetWallets.map(() => extraDistributeNativeAmount),
  //       projectId: project._id,
  //       botId: project.addons.DistributionBot._id,
  //       chainName: project.chainName,
  //     });

  //     if (result.success.success) {
  //       toast({
  //         title: 'Success',
  //         description: `Distributed ${extraDistributeNativeAmount} ${nativeCurrency} to each wallet`,
  //       });

  //       // Refresh all balances
  //       const addresses = targetWallets.map(w => w.publicKey);
  //       const balancesArray = await getWalletBalances(
  //         addresses,
  //         project.tokenAddress,
  //         project.chainName
  //       );

  //       balancesArray.forEach(balance => {
  //         updateTargetWallet(balance.address, {
  //           tokenBalance: Number(balance.tokenBalance) || 0,
  //           nativeBalance: Number(balance.nativeBalance) || 0,
  //         });
  //       });

  //       // Also refresh deposit wallet balance
  //       fetchDepositWalletBalance();
  //     }
  //   } catch (error: any) {
  //     console.error('Error distributing native:', error);
  //     toast({
  //       title: error.response?.data?.errorType || 'Error',
  //       description: error.response?.data?.errorMessage || 'Failed to distribute native currency',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setIsDistributingNative(false);
  //   }
  // }, [project, targetWallets, extraDistributeNativeAmount, nativeCurrency, toast, updateTargetWallet, fetchDepositWalletBalance]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto md:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribution Bot Setup
            </DialogTitle>
            <DialogDescription>
              Distribute tokens across multiple wallets with customizable timing
              and amounts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mt-4">
            {/* Deposit Wallet Section */}
            {depositWallet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Deposit Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted/30 p-1 rounded">
                          {formatAddress(depositWallet.publicKey)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              depositWallet.publicKey
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDepositDialogOpen(true)}
                      >
                        Deposit
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {nativeCurrency} Balance:
                        </p>
                        <p className="font-medium">
                          {depositWalletBalance !== null
                            ? `${depositWalletBalance.toFixed(4)} ${nativeCurrency}`
                            : 'Loading...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Token Balance:
                        </p>
                        <p className="font-medium">
                          0.0000 {project?.symbol || 'tokens'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Wallet Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Source Wallet Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Wallet Type</Label>
                  <Select
                    value={sourceWalletType}
                    onValueChange={(value: 'sniping' | 'imported') =>
                      setSourceWalletType(value)
                    }
                    disabled={true}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sniping">
                        Use Sniping Wallets
                      </SelectItem>
                      <SelectItem value="imported">Import from CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sourceWalletType === 'imported' && (
                  <div className="space-y-2">
                    <Label>Import Wallets from CSV</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImportingWallets}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isImportingWallets ? 'Importing...' : 'Import CSV'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CSV format: privateKey,publicKey (one wallet per line)
                    </p>
                  </div>
                )}

                {sourceWallets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Source Wallets (
                        {sourceWallets.filter((w) => w.isSelected).length}/
                        {sourceWallets.length} selected)
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleManualRefresh}
                          disabled={!project?.tokenAddress || isLoadingBalances}
                          className={cn(
                            isLoadingBalances && styles.refreshSpin
                          )}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                        >
                          {showPrivateKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button> */}
                      </div>
                    </div>
                    {sourceWallets.filter((w) => w.isSelected).length === 0 && (
                      <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border">
                        💡 Please select at least one source wallet to proceed
                        with distribution.
                      </div>
                    )}
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={areAllSourceWalletsSelected}
                                  onCheckedChange={handleSelectAllSourceWallets}
                                  aria-label="Select all wallets"
                                />
                              </div>
                            </TableHead>
                            <TableHead>Address</TableHead>
                            {showPrivateKeys && (
                              <TableHead>Private Key</TableHead>
                            )}
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sourceWallets.map((wallet) => (
                            <SourceWalletRow
                              key={wallet.publicKey}
                              wallet={wallet}
                              showPrivateKeys={showPrivateKeys}
                              onSelect={() =>
                                handleWalletSelection(
                                  wallet.publicKey,
                                  'source'
                                )
                              }
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Wallet Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Target Wallets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Target Wallets</Label>
                    <Input
                      type="number"
                      value={targetWalletCount}
                      onChange={(e) =>
                        setTargetWalletCount(Number(e.target.value))
                      }
                      min={1}
                      max={1000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      onClick={generateTargetWallets}
                      disabled={isGeneratingWallets || !project}
                      className="w-full"
                    >
                      {isGeneratingWallets
                        ? 'Generating...'
                        : 'Generate Wallets'}
                    </Button>
                  </div>
                </div>

                {targetWallets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Generated Target Wallets ({targetWallets.length})
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchTargetWalletBalances}
                        disabled={!project?.tokenAddress || isLoadingBalances}
                        className={cn(isLoadingBalances && styles.refreshSpin)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Extra Native Distribution */}
                    {/* <div className="border rounded-lg p-3 bg-muted/10">
                      <h3 className="text-sm font-medium mb-2">
                        Distribute Extra {nativeCurrency}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs">Amount per wallet:</Label>
                          <Input
                            type="number"
                            value={extraDistributeNativeAmount}
                            onChange={(e) => setExtraDistributeNativeAmount(Number(e.target.value))}
                            step="0.01"
                            min="0"
                            className="w-20 h-8 text-xs"
                          />
                          <span className="text-xs">{nativeCurrency}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={handleDistributeExtraNative}
                          disabled={!targetWallets.length || isDistributingNative}
                          className="h-8"
                        >
                          {isDistributingNative ? 'Distributing...' : 'Distribute'}
                        </Button>
                      </div>
                    </div> */}

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={isAllWalletsSelectedForMulti}
                                onCheckedChange={
                                  handleSelectAllForMultiOperations
                                }
                                aria-label="Select all target wallets for operations"
                              />
                            </TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">
                              {nativeCurrency}
                            </TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-center w-16">
                              Sell %
                            </TableHead>
                            <TableHead className="text-center">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {targetWallets.map((wallet) => (
                            <PostOperationTargetWalletRow
                              key={wallet.publicKey}
                              wallet={wallet}
                              project={project}
                              nativeCurrency={nativeCurrency}
                              executingSingleSells={executingSingleSells}
                              onSingleSell={handleSingleSell}
                              onUpdateWallet={updateTargetWallet}
                              copyToClipboard={copyToClipboard}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Multi-operation buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        onClick={handleMultiSell}
                        disabled={
                          isExecutingMultiSell ||
                          isCollectingNative ||
                          !targetWallets.some(
                            (w) =>
                              w.isSelectedForMutilSell &&
                              (w.tokenBalance || 0) > 0
                          )
                        }
                        size="sm"
                      >
                        {isExecutingMultiSell ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Multi Sell (
                        {
                          targetWallets.filter((w) => w.isSelectedForMutilSell)
                            .length
                        }
                        )
                      </Button>

                      <Button
                        onClick={handleCollectNative}
                        variant="outline"
                        disabled={
                          isCollectingNative ||
                          isExecutingMultiSell ||
                          !targetWallets.some(
                            (w) => (w.nativeBalance || 0) > 0.00001
                          )
                        }
                        size="sm"
                      >
                        {isCollectingNative ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Collect {nativeCurrency}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAllTargetWallets}
                        disabled={isDeletingWallets}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDeletingWallets ? 'Downloading...' : 'Download CSV'}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelectedTargetWallets}
                        disabled={
                          isDeletingWallets ||
                          targetWallets.filter((w) => w.isSelectedForMutilSell)
                            .length === 0
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeletingWallets
                          ? 'Deleting...'
                          : `Delete (${targetWallets.filter((w) => w.isSelectedForMutilSell).length})`}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribution Style */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="equal"
                      name="distribution"
                      value="equal"
                      checked={distributionStyle === 'equal'}
                      onChange={(e) =>
                        setDistributionStyle(
                          e.target.value as 'equal' | 'random'
                        )
                      }
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label
                      htmlFor="equal"
                      className="font-normal cursor-pointer"
                    >
                      Equal Amount - Same amount to each wallet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="random"
                      name="distribution"
                      value="random"
                      checked={distributionStyle === 'random'}
                      onChange={(e) =>
                        setDistributionStyle(
                          e.target.value as 'equal' | 'random'
                        )
                      }
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label
                      htmlFor="random"
                      className="font-normal cursor-pointer"
                    >
                      Random Amount - Varying amounts within range
                    </Label>
                  </div>
                </div>

                {/* <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Amount to Distribute
                  </Label>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="use-all-tokens"
                        checked={useAllTokens}
                        onCheckedChange={(checked) =>
                          setUseAllTokens(checked === true)
                        }
                      />
                      <Label
                        htmlFor="use-all-tokens"
                        className="font-normal cursor-pointer"
                      >
                        Use all tokens from selected source wallets
                      </Label>
                    </div>

                    {useAllTokens ? (
                      <div className="ml-7 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Total available from selected wallets:
                        </div>
                        <div className="text-lg font-semibold">
                          {totalTokensFromSourceWallets.toLocaleString()} tokens
                        </div>
                        {totalTokensFromSourceWallets === 0 && (
                          <div className="text-sm text-orange-600 mt-1">
                            ⚠️ No tokens available in selected source wallets
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-7 space-y-2">
                        <Label htmlFor="custom-amount">Custom Amount</Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          value={totalTokens}
                          onChange={(e) => setTotalTokens(e.target.value)}
                          placeholder="Enter custom amount"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                </div> */}

                {/* {distributionStyle === 'random' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Amount per Wallet</Label>
                      <Input
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="Min amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Amount per Wallet</Label>
                      <Input
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="Max amount"
                      />
                    </div>
                  </div>
                )} */}
              </CardContent>
            </Card>

            {/* Time Interval Settings */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Time Interval Between Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Randomize Intervals</Label>
                  <Switch checked={randomizeInterval} onCheckedChange={setRandomizeInterval} />
                </div> 

                <div className="space-y-2">
                  <Label>Fixed Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={timeInterval}
                    onChange={(e) => setTimeInterval(Number(e.target.value))}
                    min={1}
                  />
                </div>

                {randomizeInterval ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={minInterval}
                        onChange={(e) => _setMinInterval(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={maxInterval}
                        onChange={(e) => _setMaxInterval(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fixed Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={timeInterval}
                      onChange={(e) => setTimeInterval(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                )} 

                <div className="text-sm text-muted-foreground">
                  {randomizeInterval 
                    ? `Random interval between ${minInterval}-${maxInterval} seconds`
                    : `Fixed ${timeInterval} second interval between transactions`
                  }
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Source Wallets:</span>
                    <span
                      className={
                        sourceWallets.filter((w) => w.isSelected).length === 0
                          ? 'text-red-500'
                          : 'text-green-600'
                      }
                    >
                      {sourceWallets.filter((w) => w.isSelected).length}{' '}
                      selected
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target Wallets:</span>
                    <span
                      className={
                        targetWallets.length === 0
                          ? 'text-red-500'
                          : 'text-green-600'
                      }
                    >
                      {targetWallets.length} generated
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Tokens:</span>
                    <span
                      className={
                        effectiveTotalTokens === 0
                          ? 'text-red-500'
                          : 'text-green-600'
                      }
                    >
                      {effectiveTotalTokens.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({useAllTokens ? 'from source' : 'custom'})
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Distribution Style:</span>
                    <span className="capitalize">{distributionStyle}</span>
                  </div>
                  {distributionStyle === 'equal' &&
                    targetWallets.length > 0 &&
                    effectiveTotalTokens > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Per Wallet:</span>
                        <span>
                          {(
                            effectiveTotalTokens / targetWallets.length
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  {/* {distributionStyle === 'random' && (
                    <div className="flex justify-between text-sm">
                      <span>Amount Range:</span>
                      <span>
                        {minAmount} - {maxAmount}
                      </span>
                    </div>
                  )} */}
                </div>

                <Separator />

                <div className="space-y-2">
                  {/* <div className="flex justify-between text-sm">
                    <span>Interval Type:</span>
                    <span>{randomizeInterval ? 'Random' : 'Fixed'}</span>
                  </div> */}
                  {/* <div className="flex justify-between text-sm">
                    <span>Timing:</span>
                    <span>
                      {randomizeInterval 
                        ? `${minInterval}-${maxInterval}s`
                        : `${timeInterval}s`
                      }
                    </span>
                  </div> */}
                  {targetWallets.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Est. Duration:</span>
                      <span>
                        {randomizeInterval
                          ? `${Math.floor((((minInterval + maxInterval) / 2) * targetWallets.length) / 60)}m`
                          : `${Math.floor((timeInterval * targetWallets.length) / 60)}m`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {project?.addons?.DistributionBot?.isEnabled ? (
              <Button
                onClick={stopDistribution}
                disabled={isDistributing}
                variant="destructive"
              >
                {isDistributing ? 'Stopping...' : 'Stop Distribution'}
              </Button>
            ) : (
              <Button
                onClick={startDistribution}
                // disabled={
                //   isDistributing ||
                //   sourceWallets.filter(w => w.isSelected).length === 0 ||
                //   targetWallets.length === 0 ||
                //   effectiveTotalTokens <= 0
                // }
              >
                {isDistributing ? 'Starting...' : 'Start Distribution'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Native Deposit Dialog */}
      {depositWallet && (
        <NativeDepositDialog
          open={isDepositDialogOpen}
          onOpenChange={setIsDepositDialogOpen}
          depositWalletAddress={depositWallet.publicKey}
          onSuccess={fetchDepositWalletBalance}
          chainName={project?.chainName || 'BSC_MAINNET'}
        />
      )}
    </>
  );
}
