"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

type WalletInfo = {
  address: string
  bnbBalance: number
  tokenAmount: number
  bnbToSpend: number
}

type SimulationResult = {
  wallets: WalletInfo[]
  totalBnbNeeded: number
  addLiquidityBnb: number
  snipingBnb: number
  currentBalance: number
  sufficientBalance: boolean
}

type SimulateAndExecuteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSimulationResult: (success: boolean) => void // Updated prop
}

export function SimulateAndExecuteDialog({ open, onOpenChange, onSimulationResult }: SimulateAndExecuteDialogProps) {
  const [walletCount, setWalletCount] = useState(5)
  const [snipePercentage, setSnipePercentage] = useState(50)
  const [generatedWallets, setGeneratedWallets] = useState<WalletInfo[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBnbDistributed, setIsBnbDistributed] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const { toast } = useToast()

  const handleGenerateWallets = () => {
    if (walletCount > 50) {
      toast({
        title: "Maximum Wallet Count Exceeded",
        description: "The maximum number of wallets allowed is 50.",
        variant: "destructive",
      })
      setWalletCount(50)
      return
    }
    setIsGenerating(true)
    // Simulate wallet generation
    setTimeout(() => {
      const wallets: WalletInfo[] = Array.from({ length: walletCount }, (_, i) => ({
        address: `0x${i.toString(16).padStart(40, "0")}`,
        bnbBalance: 0,
        tokenAmount: Math.random() * 1000000,
        bnbToSpend: 0,
      }))
      setGeneratedWallets(wallets)
      setIsGenerating(false)
    }, 2000)
  }

  const handleDistributeBnb = () => {
    const totalBnb = 10 // Example total BNB
    const addLiquidityBnb = 5 // Example BNB for adding liquidity
    const snipingBnb = (totalBnb - addLiquidityBnb) * (snipePercentage / 100)

    const updatedWallets = generatedWallets.map((wallet) => ({
      ...wallet,
      bnbToSpend: snipingBnb / walletCount,
    }))

    setGeneratedWallets(updatedWallets)
    setIsBnbDistributed(true)
  }

  const handleSimulate = () => {
    const totalBnb = 10 // Example total BNB
    const addLiquidityBnb = 5 // Example BNB for adding liquidity
    const snipingBnb = generatedWallets.reduce((sum, wallet) => sum + wallet.bnbToSpend, 0)
    const currentBalance = 12 // Example current balance

    const simulationResult: SimulationResult = {
      wallets: generatedWallets,
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
      onSimulationResult(success) // Updated callback
      onOpenChange(false)
    } else {
      toast({
        title: "Insufficient Balance",
        description: "Please add more BNB to your wallet before executing.",
        variant: "destructive",
      })
    }
  }

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
                Snipe Percentage
              </Label>
              <Input
                id="snipePercentage"
                type="number"
                value={snipePercentage}
                onChange={(e) => setSnipePercentage(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleGenerateWallets} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Wallets...
              </>
            ) : (
              "Generate Wallets"
            )}
          </Button>
          <div className="flex justify-between items-start">
            <div className="w-1/2 pr-4">
              {generatedWallets.length > 0 && (
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
                      {generatedWallets.map((wallet) => (
                        <TableRow key={wallet.address}>
                          <TableCell>{`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}</TableCell>
                          <TableCell>{wallet.bnbBalance.toFixed(4)}</TableCell>
                          <TableCell>{wallet.tokenAmount.toFixed(0)}</TableCell>
                          <TableCell>{wallet.bnbToSpend.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleDistributeBnb} disabled={!generatedWallets.length || isBnbDistributed}>
                  Distribute BNB
                </Button>
                <Button onClick={handleSimulate} disabled={!isBnbDistributed}>
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
          <Button onClick={handleExecute} disabled={!simulationResult || !simulationResult.sufficientBalance}>
            Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

