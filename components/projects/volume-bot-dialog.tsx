"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type Speed = "turtle" | "slow" | "medium" | "high" | "hyper"

const speedOptions: Speed[] = ["turtle", "slow", "medium", "high", "hyper"]

const speedInfo = {
  turtle: "1 BNB will last for 24 hours",
  slow: "1 BNB will last for 8 hours",
  medium: "1 BNB will last for 4 hours",
  high: "1 BNB will last for 2 hours",
  hyper: "1 BNB will last for 30 minutes",
}

interface VolumeBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: {
    speed: Speed
    maxBundleSize: number
  }
  onSave: (config: { speed: Speed; maxBundleSize: number }) => void
}

export function VolumeBotDialog({ open, onOpenChange, config, onSave }: VolumeBotDialogProps) {
  const [currentConfig, setCurrentConfig] = useState(config)

  const handleSpeedChange = (newSpeed: Speed) => {
    setCurrentConfig((prev) => ({ ...prev, speed: newSpeed }))
  }

  const handleBundleSizeChange = (value: number[]) => {
    setCurrentConfig((prev) => ({ ...prev, maxBundleSize: value[0] }))
  }

  const handleSave = () => {
    onSave(currentConfig)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Volume Bot Configuration</DialogTitle>
        </DialogHeader>
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-medium">Bot Speed:</h3>
            <div className="grid grid-cols-5 gap-2">
              {speedOptions.map((speed) => (
                <Button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  variant={currentConfig.speed === speed ? "default" : "outline"}
                  className={cn(
                    "capitalize",
                    currentConfig.speed === speed && "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {speed}
                </Button>
              ))}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Speed options are an estimate as to how long 1 BNB will last.</p>
              <p>Times will vary depending on network congestion and buy amounts.</p>
            </div>
            <div className="space-y-1">
              {speedOptions.map((speed) => (
                <p
                  key={speed}
                  className={cn(
                    "text-sm",
                    currentConfig.speed === speed ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}: {speedInfo[speed]}
                </p>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-medium">Max bundle size (BNB):</h3>
            <Slider
              value={[currentConfig.maxBundleSize]}
              onValueChange={handleBundleSizeChange}
              max={1}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0.1</span>
              <span>0.25</span>
              <span>0.5</span>
              <span>1</span>
            </div>
            <p className="text-sm font-medium">Current value: {currentConfig.maxBundleSize.toFixed(2)} BNB</p>
            <p className="text-sm text-muted-foreground">
              You can pause the bot and adjust speed/buy amount at any time and restart the bot. You cannot withdraw
              your BNB after the bot starts. You can top off the bot with BNB at any time.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

