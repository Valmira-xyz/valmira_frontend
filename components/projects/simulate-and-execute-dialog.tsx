"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Copy, ExternalLink, Download } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { generateWallets, getWalletBalances, deleteMultipleWallets } from "@/store/slices/walletSlice"
import type { AppDispatch, RootState } from "@/store/store"
import type { Project } from "@/types"
import { BotService } from "@/services/botService"
import { walletApi } from "@/services/walletApi"

// Define the SubWallet type for the LiquidationSnipeBot addon
interface SubWallet {
  _id: string;
  publicKey: string;
  role: string;
}

interface WalletInfo {
  publicKey: string
  bnbToSpend?: number
  bnbBalance?: number
  tokenAmount?: number
  tokenBalance?: number
  role?: string
  _id?: string
}

// Define the LiquidationSnipeBot addon type
interface LiquidationSnipeBotAddon {
  subWalletIds: SubWallet[];
  depositWalletId?: {
    publicKey: string;
    _id: string;
  };
  _id: string;
  // Add other properties if needed
}

interface WalletBalances {
  [key: string]: {
    bnb: number;
    token: number;
  }
}

type SimulationResult = {
  wallets: WalletInfo[]
  totalBnbNeeded: number
  addLiquidityBnb: number
  snipingBnb: number
  tipBnb?: number
  gasCost?: number
  currentBnbBalance: number
  currentTokenBalance: number
  tokenAmountRequired?: number
  sufficientBalance: boolean
  gasDetails?: {
    tipTransactionGas?: number
    addLiquidityGas?: number
    openTradingGas?: number
    snipeGas?: number
    distributionGas?: number
  }
  poolSimulation?: {
    initialReserves?: {
      bnb: number
      token: number
    }
    finalReserves?: {
      bnb: number
      token: number
    }
    priceImpact?: number
  }
}

interface ExtendedProject extends Project {
  addons: {
    LiquidationSnipeBot: LiquidationSnipeBotAddon;
    [key: string]: any;
  };
  totalSupply?: string;
  tokenAddress: string;
  symbol: string;
  isImported?: boolean;
}

type SimulateAndExecuteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSimulationResult: (success: boolean) => void
}

export function SimulateAndExecuteDialog({
  open,
  onOpenChange,
  onSimulationResult
}: SimulateAndExecuteDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { currentProject, loading: isProjectLoading } = useSelector((state: RootState) => state.projects)
  const project = currentProject as ExtendedProject;
  const botState = useSelector((state: RootState) => state.bots)
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletCount, setWalletCount] = useState(project?.addons?.LiquidationSnipeBot?.subWalletIds?.length || 5)
  const [snipePercentage, setSnipePercentage] = useState(50)
  const [isBnbDistributed, setIsBnbDistributed] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [doAddLiquidity, setDoAddLiquidity] = useState(false)
  const [liquidityBnbAmount, setLiquidityBnbAmount] = useState(0)
  const [liquidityTokenAmount, setLiquidityTokenAmount] = useState(0)
  const { toast } = useToast()
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastBalanceUpdateRef = useRef<number>(0)
  const MIN_BALANCE_UPDATE_INTERVAL = 5000 // Minimum 5 seconds between balance updates
  const [isEstimatingFees, setIsEstimatingFees] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [estimationResult, setEstimationResult] = useState<any>(null)

  // Function to fetch balances with error handling and rate limiting
  const fetchBalances = async (addresses: string[]) => {
    if (!project?.tokenAddress || addresses.length === 0) return;

    // Check if we're already loading balances
    if (isLoadingBalances) return;

    // Check if enough time has passed since last update
    const now = Date.now();
    if (now - lastBalanceUpdateRef.current < MIN_BALANCE_UPDATE_INTERVAL) {
      // If an update is already scheduled, don't schedule another one
      if (balanceUpdateTimeoutRef.current) return;

      // Schedule an update for later with exponential backoff
      const backoffTime = Math.min(
        MIN_BALANCE_UPDATE_INTERVAL * 2,
        Math.max(MIN_BALANCE_UPDATE_INTERVAL, now - lastBalanceUpdateRef.current) * 2
      );

      balanceUpdateTimeoutRef.current = setTimeout(() => {
        fetchBalances(addresses);
      }, backoffTime);
      return;
    }

    try {
      setIsLoadingBalances(true);
      lastBalanceUpdateRef.current = now;

      // Clear any pending updates
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current);
        balanceUpdateTimeoutRef.current = undefined;
      }

      const response = await dispatch(getWalletBalances({
        tokenAddress: project.tokenAddress,
        walletAddresses: addresses
      })).unwrap();

      if (response && response.length > 0) {
        setWallets(prev => {
          const updatedWallets = [...prev];

          // Add or update deposit wallet if it exists
          const depositWalletId = project.addons.LiquidationSnipeBot?.depositWalletId;
          if (depositWalletId?.publicKey) {
            const depositBalance = response.find(
              (b: any) => b.address === depositWalletId.publicKey
            );

            const depositWallet = {
              publicKey: depositWalletId.publicKey,
              bnbBalance: depositBalance?.bnbBalance || 0,
              tokenBalance: depositBalance?.tokenAmount || 0,
              role: 'botmain'
            };

            const depositIndex = updatedWallets.findIndex(w => w.role === 'botmain');
            if (depositIndex >= 0) {
              updatedWallets[depositIndex] = depositWallet;
            } else {
              updatedWallets.unshift(depositWallet);
            }
          }

          // Update sub-wallets with their balances
          return updatedWallets.map(wallet => {
            if (wallet.role === 'botmain') return wallet;
            const balance = response.find((b: any) => b.address === wallet.publicKey);
            return {
              ...wallet,
              bnbBalance: balance?.bnbBalance || 0,
              tokenBalance: balance?.tokenAmount || 0
            };
          });
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch wallet balances:", error);
      const isRateLimit =
        error?.response?.status === 429 ||
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('rate limit');

      if (isRateLimit) {
        // On rate limit, schedule retry with exponential backoff
        const backoffTime = Math.min(
          30000, // Max 30 seconds
          Math.max(MIN_BALANCE_UPDATE_INTERVAL, now - lastBalanceUpdateRef.current) * 2
        );

        if (balanceUpdateTimeoutRef.current) {
          clearTimeout(balanceUpdateTimeoutRef.current);
        }

        balanceUpdateTimeoutRef.current = setTimeout(() => {
          fetchBalances(addresses);
        }, backoffTime);
      } else {
        toast({
          title: "Error Fetching Balances",
          description: "Failed to fetch wallet balances",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Initialize wallets when dialog opens
  useEffect(() => {
    if (open && project?.addons?.LiquidationSnipeBot) {
      // Initialize wallets from currentProject
      const subWallets = project.addons.LiquidationSnipeBot.subWalletIds?.map((wallet: SubWallet) => ({
        publicKey: wallet.publicKey,
        bnbBalance: 0,
        tokenBalance: 0,
        bnbToSpend: 0,
        tokenAmount: 0,
        role: 'botsub',
        _id: wallet._id
      })) || [];

      setWallets(subWallets);
      setWalletCount(subWallets.length || 5);

      if (project.tokenAddress) {
        // Collect all wallet addresses to fetch balances
        const allAddresses = [
          ...(project.addons.LiquidationSnipeBot.depositWalletId?.publicKey ? [project.addons.LiquidationSnipeBot.depositWalletId.publicKey] : []),
          ...subWallets.map(w => w.publicKey)
        ];

        // Initial balance fetch with a longer delay
        if (balanceUpdateTimeoutRef.current) {
          clearTimeout(balanceUpdateTimeoutRef.current);
        }

        // Use a longer initial delay to avoid rate limiting
        balanceUpdateTimeoutRef.current = setTimeout(() => {
          fetchBalances(allAddresses);
        }, 5000);
      }
    }

    // Cleanup when dialog closes
    return () => {
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current);
      }
      setWallets([]);
      setIsBnbDistributed(false);
      setSimulationResult(null);
      lastBalanceUpdateRef.current = 0;
    };
  }, [open, project]);

  const handleGenerateWallets = async () => {
    if (!project?.addons?.LiquidationSnipeBot) {
      toast({
        title: "Bot Not Found",
        description: "LiquidationSnipeBot is not configured for this project.",
        variant: "destructive",
      })
      return
    }

    const existingWalletCount = project.addons.LiquidationSnipeBot.subWalletIds?.length || 0
    const requestedCount = walletCount - existingWalletCount

    if (walletCount > 50) {
      toast({
        title: "Maximum Wallet Count Exceeded",
        description: "The maximum number of wallets allowed is 50.",
        variant: "destructive",
      })
      setWalletCount(50)
      return
    }

    // Handle wallet deletion if requested count is less than existing count
    if (requestedCount < 0) {
      const walletsToDelete = project.addons.LiquidationSnipeBot.subWalletIds.slice(walletCount).map(w => w._id)
      const confirmDelete = window.confirm(
        `This will delete ${Math.abs(requestedCount)} wallets from the end of your wallet list. This action cannot be undone. Do you want to proceed?`
      )

      if (!confirmDelete) {
        setWalletCount(existingWalletCount)
        return
      }

      try {
        setIsGenerating(true)
        await dispatch(deleteMultipleWallets({
          projectId: project._id,
          walletIds: walletsToDelete
        })).unwrap()

        toast({
          title: "Wallets Deleted",
          description: `Successfully deleted ${Math.abs(requestedCount)} wallets.`,
        })
        return
      } catch (error) {
        toast({
          title: "Error Deleting Wallets",
          description: error instanceof Error ? error.message : "Failed to delete wallets",
          variant: "destructive",
        })
        return
      } finally {
        setIsGenerating(false)
      }
    }

    try {
      setIsGenerating(true)
      await dispatch(generateWallets({
        projectId: project._id,
        count: requestedCount,
        botId: project.addons.LiquidationSnipeBot._id
      })).unwrap()

      // After generating wallets, fetch their balances with a longer delay
      if (project.addons.LiquidationSnipeBot.subWalletIds) {
        const addresses = project.addons.LiquidationSnipeBot.subWalletIds.map(
          (wallet: SubWallet) => wallet.publicKey
        );

        // Schedule balance fetch with a longer delay
        if (balanceUpdateTimeoutRef.current) {
          clearTimeout(balanceUpdateTimeoutRef.current);
        }
        balanceUpdateTimeoutRef.current = setTimeout(() => {
          fetchBalances(addresses);
        }, 5000);
      }
    } catch (error) {
      toast({
        title: "Error Generating Wallets",
        description: error instanceof Error ? error.message : "Failed to generate wallets",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDistributeBnb = async () => {
    try {
      const depositWallet = project?.addons?.LiquidationSnipeBot?.depositWalletId;
      if (!depositWallet) {
        toast({
          title: "Error",
          description: "Deposit wallet not found",
          variant: "destructive",
        });
        return;
      }

      // Calculate amounts for each wallet based on the estimation
      const subWalletAddresses = project.addons.LiquidationSnipeBot.subWalletIds
        .map((w: SubWallet) => w.publicKey)

      // Use the wallet's bnbToSpend value or a default if not set
      const amounts = wallets
        .filter(w => w.role !== 'botmain')
        .map(w => w.bnbToSpend || 0);

      if (amounts.some(amount => amount <= 0)) {
        toast({
          title: "Error",
          description: "Please assign BNB amounts to all wallets first",
          variant: "destructive",
        });
        return;
      }

      setIsEstimatingFees(true);
      const result = await BotService.distributeBnb({
        subWallets: subWalletAddresses,
        amounts,
      });
      setIsEstimatingFees(false);

      if (result.success) {
        setIsBnbDistributed(true);
        toast({
          title: "Success",
          description: "BNB distributed successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to distribute BNB",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsEstimatingFees(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to distribute BNB",
        variant: "destructive",
      });
    }
  };

  const handleEstimateFees = async () => {
    if (!project?.addons?.LiquidationSnipeBot) return;

    const depositWallet = project.addons.LiquidationSnipeBot.depositWalletId;
    if (!depositWallet) {
      toast({
        title: "Error",
        description: "Deposit wallet not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEstimatingFees(true);

      // Call the estimateFees endpoint
      const result = await BotService.estimateSnipeFees({
        projectId: project._id,
        botId: project.addons.LiquidationSnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: wallets.filter(w => w.role !== 'botmain').map(w => w.publicKey),
        tokenAmounts2Buy: wallets.filter(w => w.role !== 'botmain').map(w => w.tokenAmount || 0),
        tokenAddress: project.tokenAddress,
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity ? liquidityTokenAmount : undefined,
      });

      // Store the estimation result
      setEstimationResult(result);

      // Extract the data from the nested structure
      const estimationData = result.data || result;

      // Update the simulation result with the estimation data
      setSimulationResult({
        wallets,
        totalBnbNeeded: estimationData.totalBnbNeeded,
        addLiquidityBnb: estimationData.depositWalletRequirements.bnbForLiquidity || 0,
        snipingBnb: estimationData.depositWalletRequirements.bnbForDistribution || 0,
        tipBnb: estimationData.depositWalletRequirements.bnbForTip || 0,
        gasCost: estimationData.depositWalletRequirements.gasCost || 0,
        currentBnbBalance: estimationData.depositWalletRequirements.currentBnb ||
          wallets.find(w => w.role === 'botmain')?.bnbBalance || 0,
        currentTokenBalance: estimationData.depositWalletRequirements.currentToken ||
          wallets.find(w => w.role === 'botmain')?.tokenBalance || 0,
        tokenAmountRequired: estimationData.depositWalletRequirements.tokenAmountRequired || 0,
        sufficientBalance: (estimationData.depositWalletRequirements.currentBnb ||
          wallets.find(w => w.role === 'botmain')?.bnbBalance || 0) >= estimationData.totalBnbNeeded,
        gasDetails: estimationData.estimatedGasCosts || {},
        poolSimulation: estimationData.poolSimulation || {},
      });

      // Update the wallets with the estimated BNB needed
      if (estimationData.subWalletRequirements && estimationData.subWalletRequirements.length > 0) {
        setWallets(prevWallets =>
          prevWallets.map(wallet => {
            const requirement = estimationData.subWalletRequirements.find(
              (req: any) => req.address === wallet.publicKey
            );

            if (requirement) {
              return {
                ...wallet,
                bnbBalance: requirement.bnbBalance || wallet.bnbBalance || 0,
                bnbToSpend: requirement.bnbNeeded || 0,
                tokenAmount: requirement.tokenAmount || wallet.tokenAmount || 0
              };
            }
            return wallet;
          })
        );
      }

      toast({
        title: "Success",
        description: "Fee estimation completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to estimate fees",
        variant: "destructive",
      });
    } finally {
      setIsEstimatingFees(false);
    }
  };

  const handleSimulate = async () => {
    if (!project?.addons?.LiquidationSnipeBot) return;

    const depositWallet = project.addons.LiquidationSnipeBot.depositWalletId;
    if (!depositWallet) {
      toast({
        title: "Error",
        description: "Deposit wallet not found",
        variant: "destructive",
      });
      return;
    }

    // Check if we have estimation results
    if (!estimationResult) {
      toast({
        title: "Error",
        description: "Please estimate fees first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSimulating(true);

      // Filter out wallets without _id
      const subWallets = wallets.filter(w => w.role !== 'botmain' && w._id);
      if (subWallets.length === 0) {
        throw new Error("No valid sub-wallets found");
      }

      // Get the private keys (or IDs in this case)
      const subWalletAddresses = project.addons.LiquidationSnipeBot.subWalletIds
        .map((w: SubWallet) => w.publicKey)

      // Simulate the snipe operation
      const result = await BotService.simulateSnipe({
        projectId: project._id,
        botId: project.addons.LiquidationSnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        tokenAddress: project.tokenAddress,
        snipeAmountPercent: snipePercentage,
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity ? liquidityTokenAmount : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Simulation failed");
      }

      toast({
        title: "Success",
        description: "Snipe simulation completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to simulate snipe",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecute = async () => {
    if (!simulationResult || !simulationResult.sufficientBalance || !project?.addons?.LiquidationSnipeBot) {
      toast({
        title: "Error",
        description: "Cannot execute: insufficient balance or invalid state",
        variant: "destructive",
      });
      return;
    }

    const depositWallet = project.addons.LiquidationSnipeBot.depositWalletId;
    if (!depositWallet) {
      toast({
        title: "Error",
        description: "Deposit wallet not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExecuting(true);

      // Filter out wallets without _id
      const subWallets = wallets.filter(w => w.role !== 'botmain' && w._id);
      if (subWallets.length === 0) {
        throw new Error("No valid sub-wallets found");
      }

      // Get the private keys (or IDs in this case)
      const subWalletAddresses = subWallets
        .map(w => w.publicKey)


      const result = await BotService.executeSnipe({
        projectId: project._id,
        botId: project.addons.LiquidationSnipeBot._id,
        depositWallet: depositWallet.publicKey,
        subWallets: subWalletAddresses,
        tokenAddress: project.tokenAddress,
        snipeAmountPercent: snipePercentage,
        addInitialLiquidity: doAddLiquidity,
        bnbForLiquidity: doAddLiquidity ? liquidityBnbAmount : undefined,
        tokenAmountForLiquidity: doAddLiquidity ? liquidityTokenAmount : undefined,
      });

      if (result.success) {
        onSimulationResult(true);
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Snipe executed successfully",
        });
      } else {
        throw new Error(result.error || "Execution failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute snipe",
        variant: "destructive",
      });
      onSimulationResult(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  // Check if we have existing wallets from the project addons
  const hasExistingWallets = Boolean(project?.addons?.LiquidationSnipeBot?.subWalletIds?.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simulate & Execute Sniping</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          {project?.addons?.LiquidationSnipeBot?.depositWalletId && (
            <div className="space-y-2 border rounded-lg p-2">
              <Label className="text-base font-medium">Deposit Wallet</Label>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex gap-2 items-center">
                  <code className="text-sm font-mono">
                    {project.addons.LiquidationSnipeBot.depositWalletId.publicKey.slice(0, 6)}...
                    {project.addons.LiquidationSnipeBot.depositWalletId.publicKey.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => project.addons.LiquidationSnipeBot.depositWalletId && copyToClipboard(project.addons.LiquidationSnipeBot.depositWalletId.publicKey)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={`https://bscscan.com/address/${project.addons.LiquidationSnipeBot.depositWalletId.publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View on Explorer</span>
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      if (project.addons.LiquidationSnipeBot.depositWalletId) {
                        try {
                          const publicKey = project.addons.LiquidationSnipeBot.depositWalletId.publicKey;
                          const blob = await walletApi.downloadWalletAsCsv(publicKey);

                          // Create a URL for the blob
                          const url = window.URL.createObjectURL(blob);

                          // Create a temporary link element
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `wallet-${publicKey}.csv`);

                          // Append to the document, click it, and remove it
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          // Clean up the URL object
                          window.URL.revokeObjectURL(url);

                          toast({
                            title: "Success",
                            description: "Wallet downloaded successfully",
                          });
                        } catch (error) {
                          console.error("Failed to download wallet:", error);
                          toast({
                            title: "Download Failed",
                            description: "Could not download wallet. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download Wallet</span>
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">BNB: </span>
                    {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.bnbBalance?.toFixed(4) || '0.0000'}
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">{project.symbol}: </span>
                    {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.tokenBalance?.toFixed(0) || '0'}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const allAddresses = [
                        ...(project.addons.LiquidationSnipeBot.depositWalletId?.publicKey ? [project.addons.LiquidationSnipeBot.depositWalletId.publicKey] : []),
                        ...wallets.filter(w => w.role !== 'botmain').map(w => w.publicKey)
                      ];
                      fetchBalances(allAddresses);
                    }}
                    disabled={isLoadingBalances}
                  >
                    {isLoadingBalances ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                        <path d="M3 21v-5h5"></path>
                      </svg>
                    )}
                    <span className="sr-only">Refresh Balances</span>
                  </Button>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                💡 Please ensure your Deposit Wallet has enough {project.symbol || "tokens"} for adding initial liquidity and enough BNB to cover: {!project.isImported ? "(1) adding initial liquidity, (2) opening trading, and (3)" : "(1) adding initial liquidity and (2)"} distributing BNB to sub-wallets for sniping. The exact amount needed will be calculated in the simulation.
              </p>
              
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="doAddLiquidity"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={doAddLiquidity}
                  onChange={(e) => setDoAddLiquidity(e.target.checked)}
                />
                <Label htmlFor="doAddLiquidity" className="text-sm font-normal">
                  Add Initial Liquidity
                </Label>
              </div>
            </div>
            {doAddLiquidity && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="bnbAmount" className="text-sm">
                    BNB Amount for Liquidity
                  </Label>
                  <Input
                    id="bnbAmount"
                    type="number"
                    value={liquidityBnbAmount}
                    onChange={(e) => setLiquidityBnbAmount(Number(e.target.value))}
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenAmount" className="text-sm">
                    {project.symbol || "Token"} Amount for Liquidity
                  </Label>
                  <Input
                    id="tokenAmount"
                    type="number"
                    value={liquidityTokenAmount}
                    onChange={(e) => setLiquidityTokenAmount(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>
            )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="walletCount" className="text-right">
                Wallet Count(Maximum is 50)
              </Label>
              <div className="col-span-2 space-y-1">
                <Input
                  id="walletCount"
                  type="number"
                  value={walletCount}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (value > 50) {
                      toast({
                        title: "Maximum Wallet Count Exceeded",
                        description: "The maximum number of wallets allowed is 50.",
                        variant: "destructive",
                      })
                      setWalletCount(50)
                    } else {
                      setWalletCount(value)
                      // Reset BNB distribution state when wallet count changes
                      setIsBnbDistributed(false)
                    }
                  }}
                  min="1"
                  max="50"
                  className="w-full"
                />
              
              </div>
              <Button
                onClick={handleGenerateWallets}
                disabled={isGenerating || isProjectLoading}
              >
                {isGenerating || isProjectLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isProjectLoading ? "Loading ..." : "Applying Wallets..."}
                  </>
                ) : (
                  hasExistingWallets ? "Apply Counts" : "Create Wallets"
                )}
              </Button>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="snipePercentage" className="text-right">
                Snipe Amount(% to total supply)
              </Label>
              <div className="col-span-2 space-y-1">
                <Input
                  id="snipePercentage"
                  type="number"
                  value={snipePercentage}
                  onChange={(e) => setSnipePercentage(Number(e.target.value))}
                  className="col-span-3"
                />
                
              </div>

              <Button
                onClick={() => {
                  // Assign token amounts to wallets with ±15% random variation
                  const totalSupply = Number(project?.totalSupply || 0);
                  const totalSnipeAmount = totalSupply * (snipePercentage / 100);
                  const baseAmountPerWallet = totalSnipeAmount / walletCount;

                  // Calculate amounts with random variation for each wallet
                  setWallets(prevWallets =>
                    prevWallets.map(wallet => {
                      if (wallet.role === 'botmain') return { ...wallet, tokenAmount: 0 };

                      // Generate random variation between -15% to +15%
                      const variation = (Math.random() * 0.3) - 0.15; // -0.15 to +0.15
                      const variationMultiplier = 1 + variation;
                      const adjustedAmount = baseAmountPerWallet * variationMultiplier;

                      return {
                        ...wallet,
                        tokenAmount: Math.floor(adjustedAmount) // Round down to ensure integer amounts
                      };
                    })
                  );
                  // Reset BNB distribution state when token amounts are reassigned
                  setIsBnbDistributed(false);
                }}
                disabled={!wallets.length || isProjectLoading}
              >
                Apply Amounts
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">

              <Button
                onClick={handleEstimateFees}
                disabled={isEstimatingFees || isProjectLoading || !wallets.filter(w => w.role !== 'botmain').length}
              >
                {isEstimatingFees ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimating...
                  </>
                ) : (
                  "Estimate Fees"
                )}
              </Button>

              <Button
                onClick={handleDistributeBnb}
                disabled={!wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').length || isBnbDistributed || isProjectLoading}
              >
                Distribute BNB
              </Button>
            </div>
            <div className="flex gap-4 ml-auto text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Tokens to snipe:</span>
                <span className="font-medium">
                  {wallets
                    .filter(w => w.role !== 'botmain')
                    .reduce((sum, wallet) => sum + (wallet.tokenAmount || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total BNB to spend:</span>
                <span className="font-medium">
                  {wallets
                    .filter(w => w.role !== 'botmain')
                    .reduce((sum, wallet) => sum + (wallet.bnbToSpend || 0), 0)
                    .toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          <div>
            {(wallets.length > 0 || isProjectLoading) && (
              <div className="max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <div>BNB Balance</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const allAddresses = [
                                ...(project.addons.LiquidationSnipeBot.depositWalletId?.publicKey ? [project.addons.LiquidationSnipeBot.depositWalletId.publicKey] : []),
                                ...wallets.filter(w => w.role !== 'botmain').map(w => w.publicKey)
                              ];
                              fetchBalances(allAddresses);
                            }}
                            disabled={isLoadingBalances}
                          >
                            {isLoadingBalances ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                <path d="M21 3v5h-5"></path>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                <path d="M3 21v-5h5"></path>
                              </svg>
                            )}
                            <span className="sr-only">Refresh Balances</span>
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead>Token Amount</TableHead>
                      <TableHead>BNB to Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').length > 0 ? (
                      wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').map((wallet: WalletInfo) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell>

                            <div className="flex items-center gap-2">
                              <div>{`${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`}</div>
                              {/* <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={async () => {
                                  try {
                                    const publicKey = wallet.publicKey;
                                    const blob = await walletApi.downloadWalletAsCsv(publicKey);
                                    
                                    // Create a URL for the blob
                                    const url = window.URL.createObjectURL(blob);
                                    
                                    // Create a temporary link element
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.setAttribute("download", `wallet-${publicKey}.csv`);
                                    
                                    // Append to the document, click it, and remove it
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    
                                    // Clean up the URL object
                                    window.URL.revokeObjectURL(url);
                                    
                                    toast({
                                      title: "Success",
                                      description: "Wallet downloaded successfully",
                                    });
                                  } catch (error) {
                                    console.error("Failed to download wallet:", error);
                                    toast({
                                      title: "Download Failed",
                                      description: "Could not download wallet. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download Wallet</span>
                              </Button> */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a
                                  href={`https://bscscan.com/address/${wallet.publicKey}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">View on Explorer</span>
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{(wallet.bnbBalance || 0).toFixed(4)}</TableCell>
                          <TableCell>{(wallet.tokenAmount || 0).toFixed(0)}</TableCell>
                          <TableCell>{(wallet.bnbToSpend || 0).toFixed(4)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          <span className="text-sm text-muted-foreground">No wallets found. Generate wallets to start.</span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-col w-full gap-4">
          <div className="w-full border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Simulation Results</h3>
            {simulationResult ? (
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <p>Deposit Wallet BNB Balance: {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.bnbBalance?.toFixed(4) || '0.0000'} BNB</p>
                  <p>Deposit Wallet Token Balance: {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.tokenBalance?.toFixed(4) || '0.0000'} Tokens</p>
                  <p>BNB for Adding Liquidity: {simulationResult.addLiquidityBnb.toFixed(4)} BNB</p>
                  <p>BNB for Sniping: {simulationResult.snipingBnb.toFixed(4)} BNB</p>
                  {simulationResult.tipBnb !== undefined && (
                    <p>BNB for Tip: {simulationResult.tipBnb.toFixed(4)} BNB</p>
                  )}
                  {simulationResult.gasCost !== undefined && (
                    <p>Gas Cost: {simulationResult.gasCost.toFixed(6)} BNB</p>
                  )}
                  <p>Total BNB Needed: {simulationResult.totalBnbNeeded.toFixed(4)} BNB</p>
                </div>

                {simulationResult.poolSimulation && simulationResult.poolSimulation.initialReserves && (
                  <div className="mt-3 p-2 rounded border bg-background">
                    <h4 className="font-medium mb-1">Pool Simulation</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                      <p>Initial BNB: {simulationResult.poolSimulation.initialReserves.bnb.toFixed(4)} BNB</p>
                      <p>Initial Tokens: {simulationResult.poolSimulation.initialReserves.token.toLocaleString()} Tokens</p>
                      {simulationResult.poolSimulation.finalReserves && (
                        <>
                          <p>Final BNB: {simulationResult.poolSimulation.finalReserves.bnb.toFixed(4)} BNB</p>
                          <p>Final Tokens: {simulationResult.poolSimulation.finalReserves.token.toLocaleString()} Tokens</p>
                        </>
                      )}
                      {simulationResult.poolSimulation.priceImpact !== undefined && (
                        <p>Price Impact: {(simulationResult.poolSimulation.priceImpact * 100).toFixed(2)}%</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 p-2 rounded border bg-background">
                  <p className={simulationResult.sufficientBalance ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {simulationResult.sufficientBalance
                      ? "✓ Simulation successful. You have sufficient balance."
                      : `⚠ Insufficient balance. Need ${(simulationResult.totalBnbNeeded - simulationResult.currentBnbBalance).toFixed(4)} more BNB to Deposit Wallet.`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No simulation results yet. Click "Simulate" to see results.</p>
            )}
          </div>
          <div className="flex justify-end items-center gap-2">
            <Button
              onClick={handleSimulate}
              disabled={isSimulating || isProjectLoading || !estimationResult}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                "Simulate Snipe"
              )}
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isExecuting || !simulationResult || !simulationResult.sufficientBalance || isProjectLoading}
              className="min-w-[100px]"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                "Execute"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

