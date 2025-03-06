import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AutoSellConfig = {
  enabled: boolean
  targetPrice: number
  stopLoss: number
}

type BotConfig = {
  enabled: boolean
  amount: number
  nativeCurrency: number
  tokenAmount: number
  autoSell?: AutoSellConfig
}

type EditBotDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  botName: string
  config: BotConfig
  onSave: (config: BotConfig) => void
}

export function EditBotDialog({ open, onOpenChange, botName, config, onSave }: EditBotDialogProps) {
  const [editedConfig, setEditedConfig] = useState<BotConfig>(config)

  const handleSave = () => {
    onSave(editedConfig)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {botName} Parameters</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {botName === "Liquidation Bot" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nativeCurrency" className="text-right">
                  BNB Amount
                </Label>
                <Input
                  id="nativeCurrency"
                  type="number"
                  value={editedConfig.nativeCurrency}
                  onChange={(e) => setEditedConfig({ ...editedConfig, nativeCurrency: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tokenAmount" className="text-right">
                  Token Amount
                </Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  value={editedConfig.tokenAmount}
                  onChange={(e) => setEditedConfig({ ...editedConfig, tokenAmount: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </>
          )}
          {botName === "Auto Sell Bot" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetPrice" className="text-right">
                  Target Price
                </Label>
                <Input
                  id="targetPrice"
                  type="number"
                  value={editedConfig.autoSell?.targetPrice || 0}
                  onChange={(e) =>
                    setEditedConfig({
                      ...editedConfig,
                      autoSell: { ...editedConfig.autoSell, targetPrice: Number(e.target.value) },
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stopLoss" className="text-right">
                  Stop Loss
                </Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={editedConfig.autoSell?.stopLoss || 0}
                  onChange={(e) =>
                    setEditedConfig({
                      ...editedConfig,
                      autoSell: { ...editedConfig.autoSell, stopLoss: Number(e.target.value) },
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Triggering Price (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              value={editedConfig.amount}
              onChange={(e) => setEditedConfig({ ...editedConfig, amount: Number(e.target.value) })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

