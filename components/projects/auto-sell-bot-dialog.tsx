"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Wallet = {
  address: string
  bnbBalance: number
  tokenBalance: number
  sellPrice: number
  enabled: boolean
}

type AutoSellBotDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: {
    wallets?: Wallet[]
    status?: string
  }
  onSave: (newConfig: { wallets: Wallet[] }) => void
}

export function AutoSellBotDialog({ open, onOpenChange, config, onSave }: AutoSellBotDialogProps) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [currentTokenPrice, setCurrentTokenPrice] = useState(0.2589)
  const [simulationResult, setSimulationResult] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize wallets from config when dialog opens
    if (open && config.wallets && config.wallets.length > 0) {
      setWallets(config.wallets)
    }
  }, [open, config.wallets])

  useEffect(() => {
    // Simulating real-time token price updates
    const interval = setInterval(() => {
      setCurrentTokenPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.001
        return Number((prev + change).toFixed(4))
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleWalletChange = (index: number, field: string, value: any) => {
    const newWallets = [...wallets]
    newWallets[index] = { ...newWallets[index], [field]: value }
    setWallets(newWallets)
  }

  const handleSimulate = () => {
    const enabledWallets = wallets.filter((wallet) => wallet.enabled)
    if (enabledWallets.length === 0) {
      setSimulationResult("Please select at least one wallet for auto-selling.")
      return
    }

    const insufficientWallets = enabledWallets.filter((wallet) => wallet.bnbBalance < 0.01)
    if (insufficientWallets.length > 0) {
      setSimulationResult(
        `Warning: ${insufficientWallets.length} wallet(s) need more BNB for transaction fees (minimum 0.01 BNB required).`,
      )
      return
    }

    const invalidPrices = enabledWallets.filter((wallet) => !wallet.sellPrice || wallet.sellPrice <= 0)
    if (invalidPrices.length > 0) {
      setSimulationResult("Warning: All enabled wallets must have a valid sell price set.")
      return
    }

    setSimulationResult("All selected wallets have sufficient BNB balance for auto-selling.")
  }

  const handleApply = () => {
    if (!simulationResult || simulationResult.includes("Warning")) {
      toast({
        title: "Cannot Apply Settings",
        description: "Please ensure all selected wallets have sufficient BNB balance and valid sell prices.",
        variant: "destructive",
      })
      return
    }

    onSave({ wallets })
    toast({
      title: "Settings Applied",
      description: "Auto Sell Bot settings have been successfully applied.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Auto Sell Bot Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <Label className="text-lg">Current Token Price (USD)</Label>
            <span className="text-2xl font-bold">${currentTokenPrice}</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Enable</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>BNB Balance</TableHead>
                  <TableHead>Token Balance</TableHead>
                  <TableHead className="w-[150px]">Sell Price (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet, index) => (
                  <TableRow key={wallet.address}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={wallet.enabled}
                        onCheckedChange={(checked) => handleWalletChange(index, "enabled", checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      {`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </TableCell>
                    <TableCell>{wallet.bnbBalance.toFixed(4)}</TableCell>
                    <TableCell>{wallet.tokenBalance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={wallet.sellPrice}
                        onChange={(e) => handleWalletChange(index, "sellPrice", Number(e.target.value))}
                        step="0.0001"
                        min="0"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {simulationResult && (
            <div
              className={`p-3 rounded-md ${
                simulationResult.includes("Warning")
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {simulationResult}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between gap-2">
          <Button onClick={handleSimulate} variant="outline">
            Simulate
          </Button>
          <Button onClick={handleApply} disabled={!simulationResult || simulationResult.includes("Warning")}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

