"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, Copy, ExternalLink, HelpCircle } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { EditBotDialog } from "@/components/projects/edit-bot-dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { SimulateAndExecuteDialog } from "@/components/projects/simulate-and-execute-dialog"
import { AutoSellBotDialog } from "@/components/projects/auto-sell-bot-dialog"
import { VolumeBotDialog } from "@/components/projects/volume-bot-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project } from "@/types"

type Speed = "slow" | "medium" | "fast"

type AutoSellConfig = {
  enabled: boolean
  targetPrice: number
  stopLoss: number
}

type LiquidationSnipeBotStatus = "ready_to_snipe" | "snipe_succeeded" | "snipe_failed" | "auto_sell" | "sold_all"

const addOns = [
  {
    id: "liquidation-snipe-bot",
    name: "Liquidation & Snipe Bot",
    description:
      "Automatically add liquidity for your project token and perform first sniping with multiple user wallets in the same bundle transaction.",
    fee: 0.1,
    depositWallet: "0x9876543210fedcba9876543210fedcba98765432",
    balances: {
      native: 1.5,
      token: 1000000,
    },
    tutorialLink: "/tutorials/add-ons/liquidation-snipe-bot",
    walletCount: 10,
    totalBnbBalance: 2.5,
    totalTokenBalance: 1500000,
  },
  {
    id: "volume-bot",
    name: "Volume Bot",
    description: "Boost your token's trading volume with automated buy and sell transactions.",
    fee: 0.05,
    depositWallet: "0xabcdef1234567890abcdef1234567890abcdef12",
    balances: {
      native: 0.5,
    },
    tutorialLink: "/tutorials/add-ons/volume-bot",
  },
  {
    id: "holder-bot",
    name: "Holder Bot",
    description: "Simulate a diverse holder base by distributing tokens across multiple wallets.",
    fee: 0.08,
    depositWallet: "0x1234567890abcdef1234567890abcdef12345678",
    balances: {
      native: 0.3,
    },
    tutorialLink: "/tutorials/add-ons/holder-bot",
  },
]

interface ProjectAddOnsProps {
  project?: Project
}

export function ProjectAddOns({ project }: ProjectAddOnsProps) {
  const [configs, setConfigs] = useState(
    addOns.reduce(
      (acc, addon) => ({
        ...acc,
        [addon.id]: {
          status: addon.id === "liquidation-snipe-bot" ? ("ready_to_snipe" as LiquidationSnipeBotStatus) : undefined,
          enabled: false,
          amount: 1000,
          nativeCurrency: 0,
          tokenAmount: 0,
          autoSell: {
            enabled: false,
            targetPrice: 0,
            stopLoss: 0,
          },
          speed: "medium",
          maxBundleSize: 0.25,
        },
      }),
      {},
    ),
  )

  const [editingBot, setEditingBot] = useState<string | null>(null)
  const [isSimulateDialogOpen, setIsSimulateDialogOpen] = useState(false)
  const [isAutoSellDialogOpen, setIsAutoSellDialogOpen] = useState(false)
  const [isVolumeBotDialogOpen, setIsVolumeBotDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleToggle = (id: string) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }))
  }

  const handleEdit = (id: string) => {
    if (id === "liquidation-snipe-bot" && configs[id].status === "auto_sell") {
      setIsAutoSellDialogOpen(true)
    } else if (id === "volume-bot") {
      setIsVolumeBotDialogOpen(true)
    } else {
      setEditingBot(id)
    }
  }

  const handleSaveEdit = (id: string, newConfig: any) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newConfig },
    }))
    setEditingBot(null)
  }

  const handleSave = (id: string) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], isEditing: false },
    }))
    toast({
      title: "Changes Saved",
      description: `${addOns.find((addon) => addon.id === id)?.name} configuration has been updated.`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Address copied",
      description: "Deposit wallet address has been copied to clipboard",
    })
  }

  const calculateFee = (addon: (typeof addOns)[0], config: (typeof configs)[string]) => {
    const feeInUSD = addon.fee * config.amount
    const conversionRate = 0.003 // 1 USD = 0.003 BNB
    return (feeInUSD * conversionRate).toFixed(6)
  }

  const handleSimulateAndExecute = () => {
    setIsSimulateDialogOpen(true)
  }

  const handleSimulationResult = (success: boolean) => {
    setConfigs((prev) => ({
      ...prev,
      "liquidation-snipe-bot": {
        ...prev["liquidation-snipe-bot"],
        status: success ? "snipe_succeeded" : ("snipe_failed" as LiquidationSnipeBotStatus),
      },
    }))
    setIsSimulateDialogOpen(false)
    toast({
      title: success ? "Sniping Succeeded" : "Sniping Failed",
      description: success
        ? "The sniping operation was successful. You can now migrate to Auto Sell Bot."
        : "The sniping operation failed. You can retry or adjust your parameters.",
      variant: success ? "default" : "destructive",
    })
  }

  const handleMigrateToAutoSell = () => {
    const snipedWallets = [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        bnbBalance: 0.15,
        tokenBalance: 50000,
        sellPrice: 0,
        enabled: true,
      },
      {
        address: "0x2345678901abcdef2345678901abcdef23456789",
        bnbBalance: 0.18,
        tokenBalance: 75000,
        sellPrice: 0,
        enabled: true,
      },
      {
        address: "0x3456789012abcdef3456789012abcdef34567890",
        bnbBalance: 0.12,
        tokenBalance: 45000,
        sellPrice: 0,
        enabled: true,
      },
    ]

    setConfigs((prev) => ({
      ...prev,
      "liquidation-snipe-bot": {
        ...prev["liquidation-snipe-bot"],
        status: "auto_sell",
        wallets: snipedWallets,
      },
    }))

    toast({
      title: "Migrated to Auto Sell Bot",
      description: "Your Liquidation & Snipe Bot has been migrated to Auto Sell Bot.",
    })
  }

  const handleReset = (id: string) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: "ready_to_snipe" as LiquidationSnipeBotStatus,
        enabled: false,
        amount: 1000,
        nativeCurrency: 0,
        tokenAmount: 0,
        autoSell: {
          enabled: false,
          targetPrice: 0,
          stopLoss: 0,
        },
        speed: "medium",
        maxBundleSize: 0.25,
      },
    }))
    toast({
      title: "Bot Reset",
      description: "The Liquidation & Snipe Bot has been reset and is ready for a new operation.",
    })
  }

  const handleSaveVolumeBotConfig = (newConfig: { speed: Speed; maxBundleSize: number }) => {
    setConfigs((prev) => ({
      ...prev,
      "volume-bot": { ...prev["volume-bot"], ...newConfig },
    }))
    setIsVolumeBotDialogOpen(false)
    toast({
      title: "Volume Bot Configuration Updated",
      description: "Your changes have been saved successfully.",
    })
  }

  if (!project) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {!configs || typeof configs !== "object" ? (
        <div>Loading...</div>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Add-Ons & Configuration</h2>
          <div className="flex flex-row gap-6 overflow-x-auto pb-4">
            {addOns.map((addon) => (
              <Card key={addon.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{addon.name}</CardTitle>
                    {addon.id === "liquidation-snipe-bot" && (
                      <Badge
                        variant={
                          configs[addon.id].status === "ready_to_snipe"
                            ? "secondary"
                            : configs[addon.id].status === "snipe_failed"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {configs[addon.id].status === "ready_to_snipe" && "Ready to Snipe"}
                        {configs[addon.id].status === "snipe_succeeded" && "Snipe Succeeded"}
                        {configs[addon.id].status === "snipe_failed" && "Snipe Failed"}
                        {configs[addon.id].status === "auto_sell" && "Auto Sell Active"}
                        {configs[addon.id].status === "sold_all" && "All Tokens Sold"}
                      </Badge>
                    )}
                    {addon.id !== "liquidation-snipe-bot" && (
                      <Badge variant={configs[addon.id].enabled ? "default" : "secondary"}>
                        {configs[addon.id].enabled ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{addon.description}</CardDescription>
                  {addon.tutorialLink && (
                    <Button variant="link" asChild className="p-0 h-auto font-normal">
                      <Link href={addon.tutorialLink}>
                        <HelpCircle className="w-4 h-4 mr-2" />
                        How it works
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${addon.id}-toggle`}>Enable</Label>
                    <Switch
                      id={`${addon.id}-toggle`}
                      checked={configs[addon.id].enabled}
                      onCheckedChange={() => handleToggle(addon.id)}
                    />
                  </div>
                  {addon.depositWallet && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Deposit Wallet</Label>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <code className="text-sm font-mono">
                            {addon.depositWallet.slice(0, 6)}...{addon.depositWallet.slice(-4)}
                          </code>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(addon.depositWallet)}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy address</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a
                                href={`https://bscscan.com/address/${addon.depositWallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">View on Explorer</span>
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {addon.balances && (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>BNB Balance</Label>
                        <p className="text-xl font-bold">{addon.balances.native} BNB</p>
                      </div>
                      {addon.id === "liquidation-snipe-bot" && (
                        <div>
                          <Label>Token Balance</Label>
                          <p className="text-xl font-bold">{formatNumber(addon.balances.token)}</p>
                        </div>
                      )}
                      {addon.id === "volume-bot" && (
                        <div>
                          <Label>Generated Volume</Label>
                          <p className="text-xl font-bold">$125,000</p>
                        </div>
                      )}
                      {addon.id === "holder-bot" && (
                        <div>
                          <Label>Generated Holders</Label>
                          <p className="text-xl font-bold">247</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {addon.id === "holder-bot" ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Simply deposit SOL to the wallet address above and click Execute to start generating holders.
                      </p>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(addon.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </>
                  ) : addon.id === "liquidation-snipe-bot" ? (
                    <>
                      {(configs[addon.id].status === "snipe_succeeded" || configs[addon.id].status === "auto_sell") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(addon.id)}
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                      {configs[addon.id].status === "ready_to_snipe" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => setIsSimulateDialogOpen(true)}
                        >
                          Simulate & Execute
                        </Button>
                      )}
                      {configs[addon.id].status === "snipe_succeeded" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={handleMigrateToAutoSell}
                        >
                          Migrate to Auto Sell Bot
                        </Button>
                      )}
                      {configs[addon.id].status === "snipe_failed" && (
                        <Button
                          className="w-full mt-2 hover:bg-destructive/90 transition-colors"
                          onClick={() => setIsSimulateDialogOpen(true)}
                        >
                          Retry Sniping
                        </Button>
                      )}
                      {configs[addon.id].status === "auto_sell" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => handleEdit(addon.id)}
                        >
                          Manage Auto Sell
                        </Button>
                      )}
                      {configs[addon.id].status === "sold_all" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => handleReset(addon.id)}
                        >
                          Reset Bot
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(addon.id)}
                        className="hover:bg-primary/10 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(addon.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save & Execute
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          {editingBot && (
            <EditBotDialog
              open={!!editingBot}
              onOpenChange={(open) => !open && setEditingBot(null)}
              botName={addOns.find((a) => a.id === editingBot)?.name || ""}
              config={configs[editingBot]}
              onSave={(newConfig) => handleSaveEdit(editingBot, newConfig)}
            />
          )}
          <SimulateAndExecuteDialog
            open={isSimulateDialogOpen}
            onOpenChange={setIsSimulateDialogOpen}
            onSimulationResult={handleSimulationResult}
          />
          <AutoSellBotDialog
            open={isAutoSellDialogOpen}
            onOpenChange={setIsAutoSellDialogOpen}
            config={configs["liquidation-snipe-bot"]}
            onSave={(newConfig) => handleSaveEdit("liquidation-snipe-bot", newConfig)}
          />
          <VolumeBotDialog
            open={isVolumeBotDialogOpen}
            onOpenChange={setIsVolumeBotDialogOpen}
            config={{
              speed: configs["volume-bot"].speed,
              maxBundleSize: configs["volume-bot"].maxBundleSize,
            }}
            onSave={handleSaveVolumeBotConfig}
          />
        </>
      )}
    </div>
  )
}

