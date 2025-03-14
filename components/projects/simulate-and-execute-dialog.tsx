"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Copy, ExternalLink } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { generateWallets, getWalletBalances, setAllWalletsBnbToSpend, clearWallets, deleteMultipleWallets } from "@/store/slices/walletSlice"
import { fetchProject } from "@/store/slices/projectSlice"
import type { AppDispatch, RootState } from "@/store/store"
import type { Project, ProjectWithAddons } from "@/types"

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
  currentBnbBalance: number
  currentTokenBalance: number
  sufficientBalance: boolean
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
  const { toast } = useToast()
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastBalanceUpdateRef = useRef<number>(0)
  const MIN_BALANCE_UPDATE_INTERVAL = 5000 // Minimum 5 seconds between balance updates

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

  const handleDistributeBnb = () => {
    const totalBnb = 10 // Example total BNB
    const addLiquidityBnb = 5 // Example BNB for adding liquidity
    const snipingBnb = (totalBnb - addLiquidityBnb) * (snipePercentage / 100)
    const amountPerWallet = snipingBnb / wallets.length

    setWallets(prevWallets => 
      prevWallets.map(wallet => ({
        ...wallet,
        bnbToSpend: amountPerWallet
      }))
    )
    setIsBnbDistributed(true)
  }

  const handleSimulate = () => {
    if (!project?.addons?.LiquidationSnipeBot) return

    const totalBnb = 10 // Example total BNB
    const addLiquidityBnb = 5 // Example BNB for adding liquidity
    const snipingBnb = wallets.reduce(
      (sum, wallet) => sum + (wallet.bnbToSpend || 0),
      0
    )
    const depositWallet = project.addons.LiquidationSnipeBot.depositWalletId?.publicKey;
    const depositWalletInfo = wallets.find(wallet => wallet.publicKey === depositWallet)

    const currentBnbBalance = depositWalletInfo?.bnbBalance || 0
    const currentTokenBalance = depositWalletInfo?.tokenBalance || 0

    const simulationResult: SimulationResult = {
      wallets,
      totalBnbNeeded: addLiquidityBnb + snipingBnb,
      addLiquidityBnb,
      snipingBnb,
      currentBnbBalance,
      currentTokenBalance,
      sufficientBalance: currentBnbBalance >= addLiquidityBnb + snipingBnb,
    }

    setSimulationResult(simulationResult)
  }

  const handleExecute = () => {
    if (simulationResult && simulationResult.sufficientBalance) {
      // Here you would typically call your backend API to execute the sniping
      // For this example, we'll simulate a 70% success rate
      const success = Math.random() < 0.7
      onSimulationResult(success)
      onOpenChange(false)
    } else {
      toast({
        title: "Insufficient Balance",
        description: "Please add more BNB to your wallet before executing.",
        variant: "destructive",
      })
    }
  }

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
              <Label className="text-sm font-medium">Deposit Wallet</Label>
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
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">BNB: </span>
                    {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.bnbBalance?.toFixed(4) || '0.0000'}
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">{project.symbol}: </span>
                    {wallets.find(w => w.publicKey === project.addons.LiquidationSnipeBot.depositWalletId?.publicKey)?.tokenBalance?.toFixed(0) || '0'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                💡 Please ensure your deposit wallet has enough {project.symbol || "tokens"} for adding initial liquidity and enough BNB to cover: {!project.isImported ? "(1) adding initial liquidity, (2) opening trading, and (3)" : "(1) adding initial liquidity and (2)"} distributing BNB to sub-wallets for sniping. The exact amount needed will be calculated in the simulation.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="walletCount" className="text-right">
                Wallet Count
              </Label>
              <div className="col-span-3 space-y-1">
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
                    }
                  }}
                  min="1"
                  max="50"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Maximum 50 wallets allowed</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="snipePercentage" className="text-right">
                Snipe Amount(% to total supply)
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="snipePercentage"
                  type="number"
                  value={snipePercentage}
                  onChange={(e) => setSnipePercentage(Number(e.target.value))}
                  className="col-span-3"
                />
                <p className="text-xs text-muted-foreground">Total supply is {project.totalSupply || 'not set'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateWallets} 
              disabled={isGenerating || isProjectLoading}
            >
              {isGenerating || isProjectLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isProjectLoading ? "Loading Project Data..." : "Creating Wallets..."}
                </>
              ) : (
                hasExistingWallets ? "Update Wallet Count" : "Create Wallets"
              )}
            </Button>
            <Button
              onClick={() => {
                // Assign token amounts to wallets
                const totalSupply = Number(project?.totalSupply || 0);
                const amountPerWallet = (totalSupply * (snipePercentage / 100)) / walletCount;
                
                setWallets(prevWallets => 
                  prevWallets.map(wallet => ({
                    ...wallet,
                    tokenAmount: wallet.role === 'botmain' ? 0 : amountPerWallet
                  }))
                );
              }}
              disabled={!wallets.length || isProjectLoading}
            >
              Assign Token Amounts
            </Button>
            <Button 
              onClick={handleDistributeBnb} 
              disabled={!wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').length || isBnbDistributed || isProjectLoading}
            >
              Distribute BNB
            </Button>
            <Button 
              onClick={handleSimulate} 
              disabled={!isBnbDistributed || isProjectLoading}
            >
              Simulate
            </Button>
          </div>
          <div>
            {(wallets.length > 0 || isProjectLoading) && (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>BNB Balance</TableHead>
                      <TableHead>Token Amount</TableHead>
                      <TableHead>BNB to Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    { wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').length > 0 ? (
                      wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain').map((wallet: WalletInfo) => (
                        <TableRow key={wallet.publicKey}>
                          <TableCell>{`${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`}</TableCell>
                          <TableCell>{(wallet.bnbBalance || 0).toFixed(4)}</TableCell>
                          <TableCell>{(wallet.tokenAmount || 0).toFixed(0)}</TableCell>
                          <TableCell>{(wallet.bnbToSpend || 0).toFixed(4)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <p>Current Deposit Wallet BNB Balance: {simulationResult.currentBnbBalance.toFixed(4)} BNB</p>
                  <p>Current Deposit Wallet Token Balance: {simulationResult.currentTokenBalance.toFixed(0)} Tokens</p>
                  <p>BNB for Adding Liquidity: {simulationResult.addLiquidityBnb.toFixed(4)} BNB</p>
                  <p>BNB for Sniping: {simulationResult.snipingBnb.toFixed(4)} BNB</p>
                  <p>Total BNB Needed: {simulationResult.totalBnbNeeded.toFixed(4)} BNB</p>
                </div>
                <div className="mt-3 p-2 rounded border bg-background">
                  <p className={simulationResult.sufficientBalance ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {simulationResult.sufficientBalance
                      ? "✓ Simulation successful. You have sufficient balance."
                      : `⚠ Insufficient balance. Need ${(simulationResult.totalBnbNeeded - simulationResult.currentBnbBalance).toFixed(4)} more BNB.`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No simulation results yet. Click "Simulate" to see results.</p>
            )}
          </div>
          <div className="flex justify-end w-full">
            <Button 
              onClick={handleExecute} 
              disabled={!simulationResult || !simulationResult.sufficientBalance || isProjectLoading}
              className="min-w-[100px]"
            >
              Execute
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

