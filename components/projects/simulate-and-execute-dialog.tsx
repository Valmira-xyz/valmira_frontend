"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { generateWallets, getWalletBalances, setAllWalletsBnbToSpend, clearWallets } from "@/store/slices/walletSlice"
import { fetchProject } from "@/store/slices/projectSlice"
import type { AppDispatch, RootState } from "@/store/store"
import type { Project, ProjectWithAddons } from "@/types"

// Define the SubWallet type for the LiquidationSnipeBot addon
interface SubWallet {
  _id: string;
  publicKey: string;
  role: string;
}

// Define the LiquidationSnipeBot addon type
interface LiquidationSnipeBotAddon {
  subWalletIds: SubWallet[];
  // Add other properties if needed
}

interface WalletInfo {
  publicKey: string
  bnbToSpend?: number
  bnbBalance?: number
  tokenAmount?: number
  role?: string
}

interface WalletBalances {
  [key: string]: number
}

type SimulationResult = {
  wallets: WalletInfo[]
  totalBnbNeeded: number
  addLiquidityBnb: number
  snipingBnb: number
  currentBalance: number
  sufficientBalance: boolean
}

interface ExtendedProject extends Project {
  addons: {
    LiquidationSnipeBot: {
      subWalletIds: SubWallet[];
      bnbBalance: number;
    };
    [key: string]: any;
  };
}

type SimulateAndExecuteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSimulationResult: (success: boolean) => void
  projectId: string,
  botId: string
}

export function SimulateAndExecuteDialog({ open, onOpenChange, onSimulationResult, projectId, botId }: SimulateAndExecuteDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { currentProject, loading: isProjectLoading } = useSelector((state: RootState) => state.projects)
  const botState = useSelector((state: RootState) => state.bots)
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletCount, setWalletCount] = useState(5)
  const [snipePercentage, setSnipePercentage] = useState(50)
  const [isBnbDistributed, setIsBnbDistributed] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const { toast } = useToast()
  const project = currentProject as  ProjectWithAddons | null

  // Fetch project data when dialog opens
  useEffect(() => {
    if (open && projectId) {
      dispatch(fetchProject(projectId))
    }
  }, [open, projectId, dispatch])

  // Load existing wallets from project addons when project data is loaded
  useEffect(() => {
    if (project && open) {
      // Check if the project has the LiquidationSnipeBot addon with subWalletIds
      const liquidationSnipeBot = project.addons.LiquidationSnipeBot
      
      if (liquidationSnipeBot && liquidationSnipeBot.subWalletIds && liquidationSnipeBot.subWalletIds.length > 0) {
        // Set the wallet count to match the existing wallets
        setWalletCount(liquidationSnipeBot.subWalletIds.length)
        
        // Convert subWalletIds to WalletInfo format
        const walletInfo: WalletInfo[] = liquidationSnipeBot.subWalletIds.map(wallet => ({
          publicKey: wallet.publicKey,
          bnbBalance: 0,
          bnbToSpend: 0,
          tokenAmount: 0
        }))
        
        setWallets(walletInfo)
        
        // Extract wallet addresses to fetch balances
        const walletAddresses = liquidationSnipeBot.subWalletIds.map(wallet => wallet.publicKey)
        
        // Fetch balances for the existing wallets
        if (walletAddresses.length > 0) {
          console.log("Fetching balances for existing wallets:", walletAddresses)
          dispatch(getWalletBalances({ tokenAddress: project.tokenAddress, walletAddresses }))
            .unwrap()
            .then((response: any) => {
              // Convert array response to object mapping
              const balances = response.reduce((acc: WalletBalances, item: any) => {
                acc[item.publicKey] = item.balance
                return acc
              }, {})
              
              // Update wallets with fetched balances
              setWallets(prevWallets => 
                prevWallets.map(wallet => ({
                  ...wallet,
                  bnbBalance: balances[wallet.publicKey] || 0
                }))
              )
            })
            .catch(error => {
              console.error("Failed to fetch wallet balances:", error)
              toast({
                title: "Error Fetching Balances",
                description: "Failed to fetch wallet balances",
                variant: "destructive",
              })
            })
        }
      }
    }
  }, [project, open, dispatch])

  const handleGenerateWallets = async () => {
    if (walletCount > 50) {
      toast({
        title: "Maximum Wallet Count Exceeded",
        description: "The maximum number of wallets allowed is 50.",
        variant: "destructive",
      })
      setWalletCount(50)
      return
    }

    try {
      if (!botId) {
        toast({
          title: "Bot Not Found",
          description: "LiquidationSnipeBot is not configured for this project.",
          variant: "destructive",
        })
        return
      }
      
      setIsGenerating(true)
      await dispatch(generateWallets({ projectId, count: walletCount, botId })).unwrap()
      
      // After generating wallets, fetch their balances
      if (project?.addons?.LiquidationSnipeBot?.subWalletIds) {
        const addresses = project.addons.LiquidationSnipeBot.subWalletIds.map(
          (wallet: any) => wallet.publicKey
        )
        const response = await dispatch(getWalletBalances({ tokenAddress: project.tokenAddress, walletAddresses: addresses })).unwrap()
        
        // Convert array response to object mapping
        const balances = (response as any[]).reduce((acc: WalletBalances, item: any) => {
          acc[item.publicKey] = item.balance
          return acc
        }, {})
        
        // Update wallets state with new data
        const newWallets: WalletInfo[] = project.addons.LiquidationSnipeBot.subWalletIds.map(
          (wallet: any) => ({
            publicKey: wallet.publicKey,
            bnbBalance: balances[wallet.publicKey] || 0,
            bnbToSpend: 0,
            tokenAmount: 0
          })
        )
        setWallets(newWallets)
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
    const depositWallet = project.addons.LiquidationSnipeBot.despositWalletId?.publicKey;

    const currentBalance = wallets.find(wallet => wallet.publicKey === depositWallet)?.bnbBalance || 0

    const simulationResult: SimulationResult = {
      wallets,
      totalBnbNeeded: addLiquidityBnb + snipingBnb,
      addLiquidityBnb,
      snipingBnb,
      currentBalance,
      sufficientBalance: currentBalance >= addLiquidityBnb + snipingBnb,
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

  // Check if we have existing wallets from the project addons
  const hasExistingWallets = Boolean(project?.addons?.LiquidationSnipeBot?.subWalletIds?.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simulate & Execute Sniping</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
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
                Token Amount(%)
              </Label>
              <div className="col-span-3 space-y-1">
              <Input
                id="snipePercentage"
                type="number"
                value={snipePercentage}
                onChange={(e) => setSnipePercentage(Number(e.target.value))}
                className="col-span-3"
              />
              <p className="text-xs text-muted-foreground">Percentage of total supply to snipe</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleGenerateWallets} 
            disabled={isGenerating || isProjectLoading}
          >
            {isGenerating || isProjectLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProjectLoading ? "Loading Project Data..." : "Generating Wallets..."}
              </>
            ) : (
              hasExistingWallets ? "Refresh Wallets & assign token amounts" : "Generate Wallets & assign token amounts"
            )}
          </Button>
          <div className="flex justify-between items-start">
            <div className="w-1/2 pr-4">
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
                      {isProjectLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            <span className="text-sm text-muted-foreground">Loading wallets...</span>
                          </TableCell>
                        </TableRow>
                      ) : wallets.length > 0 ? (
                        wallets.map((wallet: WalletInfo) => (
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
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleDistributeBnb} disabled={!wallets.length || isBnbDistributed || isProjectLoading}>
                  Distribute BNB
                </Button>
                <Button onClick={handleSimulate} disabled={!isBnbDistributed || isProjectLoading}>
                  Simulate
                </Button>
              </div>
            </div>
            <div className="w-1/2 pl-4">
              <div className="space-y-2 mt-4">
                <h3 className="font-semibold">Simulation Results</h3>
                {simulationResult && (
                  <>
                    <p>Current Deposit Wallet Balance: {simulationResult.currentBalance.toFixed(4)} BNB</p>
                    <p>BNB for Adding Liquidity: {simulationResult.addLiquidityBnb.toFixed(4)} BNB</p>
                    <p>BNB for Sniping: {simulationResult.snipingBnb.toFixed(4)} BNB</p>
                    <p>Total BNB Needed: {simulationResult.totalBnbNeeded.toFixed(4)} BNB</p>
                    <p className="font-bold mt-2">
                      {simulationResult.sufficientBalance
                        ? "Simulation successful. You have sufficient balance to execute the sniping operation."
                        : `You need to add ${(simulationResult.totalBnbNeeded - simulationResult.currentBalance).toFixed(4)} BNB to your deposit wallet.`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExecute} disabled={!simulationResult || !simulationResult.sufficientBalance || isProjectLoading}>
            Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

