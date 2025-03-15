"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, Copy, ExternalLink, HelpCircle, RefreshCw, Download } from "lucide-react"
import { formatNumber, getBadgeVariant } from "@/lib/utils"
import { EditBotDialog } from "@/components/projects/edit-bot-dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { SimulateAndExecuteDialog } from "@/components/projects/simulate-and-execute-dialog"
import { AutoSellBotDialog } from "@/components/projects/auto-sell-bot-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store/store"
import { toggleBot, updateBotConfig, BotType } from "@/store/slices/botSlice"
import { getWalletBalances } from "@/store/slices/walletSlice"
import { ProjectWithAddons } from "@/types"
import { walletApi } from "@/services/walletApi"

// Define the Speed type here to avoid conflicts
type Speed = "slow" | "medium" | "fast"

type AutoSellConfig = {
  enabled: boolean
  targetPrice: number
  stopLoss: number
}

type LiquidationSnipeBotStatus = 'ready_to_simulation' 
  | "simulating" | "simulation_failed" | "simulation_succeeded" 
  | "sniping" |  'snipe_succeeded' | 'snipe_failed' 
  | 'auto_selling' | "selling" | "sell_failed" | "sell_succeeded" | "Inactive"

type BotConfig = {
  status?: LiquidationSnipeBotStatus
  enabled: boolean
  amount: number
  nativeCurrency: number
  tokenAmount: number
  autoSell: AutoSellConfig
  speed: Speed
  maxBundleSize: number
  wallets?: Array<{
    address: string
    bnbBalance: number
    tokenBalance: number
    sellPrice: number
    enabled: boolean
  }>
}

type ConfigsType = {
  [key: string]: BotConfig
}

// Define types for the project data
type DepositWallet = {
  _id: string
  publicKey: string
  botType: string
  role: string
  userId: string
  projectId: string
  createdAt: string
  updatedAt: string
  __v: number
}

type BotData = {
  _id: string
  isEnabled: boolean
  projectId: string
  userId: string
  bnbBalance: number
  estimatedFee: number
  subWalletIds: any[]
  botType: string
  status: string
  createdAt: string
  updatedAt: string
  depositWalletId: DepositWallet
  __v: number
  tokenBalance?: number
  generatedVolume?: number
  generatedHolders?: number
}

type ProjectAddons = {
  LiquidationSnipeBot?: BotData
  VolumeBot?: BotData
  HolderBot?: BotData
}

interface ProjectAddOnsProps {
  project?: ProjectWithAddons
}

// Define the addon structure
type AddonType = {
  botType: string
  name: string
  description: string
  depositWallet: string
  balances: {
    native: number
    token?: number
  }
  tutorialLink: string
  walletCount?: number
  totalBnbBalance?: number
  totalTokenBalance?: number
  generatedVolume?: number
  generatedHolders?: number
}

// Initialize addOns with empty values
const initialAddOns: AddonType[] = [
  {
    botType: "LiquidationSnipeBot",
    name: "Liquidation & Snipe Bot",
    description:
      "Automatically add liquidity for your project token and perform first sniping with multiple user wallets in the same bundle transaction.",
    depositWallet: "",
    balances: {
      native: 0,
      token: 0,
    },
    tutorialLink: "/tutorials/add-ons/LiquidationSnipeBot",
    walletCount: 10,
    totalBnbBalance: 0,
    totalTokenBalance: 0,
  },
  {
    botType: "VolumeBot",
    name: "Volume Bot",
    description: "Boost your token's trading volume with automated buy and sell transactions.",
    depositWallet: "",
    balances: {
      native: 0,
    },
    generatedVolume: 0,
    tutorialLink: "/tutorials/add-ons/VolumeBot",
  },
  {
    botType: "HolderBot",
    name: "Holder Bot",
    description: "Simulate a diverse holder base by distributing tokens across multiple wallets.",
    depositWallet: "",
    balances: {
      native: 0,
    },
    generatedHolders: 0,
    tutorialLink: "/tutorials/add-ons/HolderBot",
  },
]

// Update the SimulateAndExecuteDialog component props
interface SimulateAndExecuteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSimulationResult: (success: boolean) => void
}

// Update the VolumeBotDialog component props
interface VolumeBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: {
    speed: Speed
    maxBundleSize: number
  }
  onSave: (config: { speed: Speed; maxBundleSize: number }) => void
}

export function ProjectAddOns({ project }: ProjectAddOnsProps) {
  const [addOns, setAddOns] = useState<AddonType[]>(initialAddOns)
  const [configs, setConfigs] = useState<ConfigsType>(
    initialAddOns.reduce(
      (acc, addon) => ({
        ...acc,
        [addon.botType]: {
          status: addon.botType === "LiquidationSnipeBot" ? ("ready_to_simulation" as LiquidationSnipeBotStatus) : undefined,
          enabled: false,
          amount: 1000,
          nativeCurrency: 0,
          tokenAmount: 0,
          autoSell: {
            enabled: false,
            targetPrice: 0,
            stopLoss: 0,
          },
          speed: "medium" as Speed,
          maxBundleSize: 0.25,
        },
      }),
      {} as ConfigsType,
    ),
  )
  const [editingBot, setEditingBot] = useState<string | null>(null)
  const [isSimulateDialogOpen, setIsSimulateDialogOpen] = useState(false)
  const [isAutoSellDialogOpen, setIsAutoSellDialogOpen] = useState(false)
  const [isVolumeBotDialogOpen, setIsVolumeBotDialogOpen] = useState(false)
  const { toast } = useToast()
  const dispatch = useDispatch<AppDispatch>()
  const botState = useSelector((state: RootState) => state.bots)
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)
  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth)

  // Check if current user is the project owner
  const isProjectOwner = useMemo(() => {
    if (!user || !project || !project.owner) return false;
    
    const ownerWalletAddress = typeof project.owner === 'string' 
      ? project.owner 
      : project.owner.walletAddress;
    
    return user.walletAddress?.toLowerCase() === ownerWalletAddress?.toLowerCase();
  }, [user, project]);

  // Function to refresh wallet balances
  const refreshWalletBalances = useCallback(async () => {
    if (!project?.tokenAddress || isRefreshingBalances) return;

    try {
      setIsRefreshingBalances(true);

      // Collect all deposit wallet addresses
      const depositWallets = [];
      if (project.addons.LiquidationSnipeBot?.depositWalletId?.publicKey) {
        depositWallets.push(project.addons.LiquidationSnipeBot.depositWalletId.publicKey);
      }
      if (project.addons.VolumeBot?.depositWalletId?.publicKey) {
        depositWallets.push(project.addons.VolumeBot.depositWalletId.publicKey);
      }
      if (project.addons.HolderBot?.depositWalletId?.publicKey) {
        depositWallets.push(project.addons.HolderBot.depositWalletId.publicKey);
      }

      if (depositWallets.length === 0) return;

      const balances = await dispatch(getWalletBalances({ 
        tokenAddress: project.tokenAddress, 
        walletAddresses: depositWallets 
      })).unwrap();

      setAddOns(prevAddOns => {
        return prevAddOns.map(addon => {
          const depositWallet = addon.depositWallet;
          const balance = balances.find(b => b.address === depositWallet);
          if (balance) {
            return {
              ...addon,
              balances: {
                ...addon.balances,
                native: balance.bnbBalance,
                token: balance.tokenAmount
              }
            };
          }
          return addon;
        });
      });

      toast({
        title: "Balances Updated",
        description: "Wallet balances have been refreshed successfully.",
      });
    } catch (error: any) {
      console.error('Failed to refresh wallet balances:', error);
      const isRateLimit = 
        error?.response?.status === 429 || 
        error?.status === 429 || 
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('rate limit');
        
      if (!isRateLimit) {
        toast({
          title: "Error Refreshing Balances",
          description: "Failed to fetch wallet balances. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [project?.tokenAddress, project?.addons, dispatch]);

  // Initial fetch of balances when component mounts or project changes
  useEffect(() => {
    if (project?.tokenAddress) {
      refreshWalletBalances();
    }
  }, [project?.tokenAddress]);

  // Update addOns and configs with project data if available
  useEffect(() => {
    if (project?.addons) {
      // Create a copy of addOns to modify
      const updatedAddOns = [...addOns];
      const updatedConfigs = {...configs};
      
      // Update LiquidationSnipeBot
      if (project.addons.LiquidationSnipeBot) {
        const bot = project.addons.LiquidationSnipeBot;
        const index = updatedAddOns.findIndex(addon => addon.botType === "LiquidationSnipeBot");
        if (index !== -1) {
          updatedAddOns[index].depositWallet = bot.depositWalletId?.publicKey || "";
          
          // Update config
          updatedConfigs["LiquidationSnipeBot"] = {
            ...updatedConfigs["LiquidationSnipeBot"],
            enabled: bot.isEnabled || false,
            status: (bot.status as LiquidationSnipeBotStatus) || "Inactive"
          };
        }
      }
      
      // Update VolumeBot
      if (project.addons.VolumeBot) {
        const bot = project.addons.VolumeBot;
        const index = updatedAddOns.findIndex(addon => addon.botType === "VolumeBot");
        if (index !== -1) {
          updatedAddOns[index].depositWallet = bot.depositWalletId?.publicKey || "";
          
          // Update config
          updatedConfigs["VolumeBot"] = {
            ...updatedConfigs["VolumeBot"],
            enabled: bot.isEnabled || false
          };
        }
      }
      
      // Update HolderBot
      if (project.addons.HolderBot) {
        const bot = project.addons.HolderBot;
        const index = updatedAddOns.findIndex(addon => addon.botType === "HolderBot");
        if (index !== -1) {
          updatedAddOns[index].depositWallet = bot.depositWalletId?.publicKey || "";
          
          // Update config
          updatedConfigs["HolderBot"] = {
            ...updatedConfigs["HolderBot"],
            enabled: bot.isEnabled || false
          };
        }
      }
      
      // Update the state
      setAddOns(updatedAddOns);
      setConfigs(updatedConfigs);
    }
  }, [project]);

  const handleToggle = (id: string) => {
    if (!project?._id) {
      toast({
        title: "Error",
        description: "Project ID is missing. Cannot toggle bot.",
        variant: "destructive",
      });
      return;
    }

    // Get the current enabled state
    const currentEnabled = configs[id].enabled;
    
    // Update local state optimistically
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !currentEnabled },
    }));

    // Dispatch the toggle action to the Redux store
    dispatch(toggleBot({
      projectId: project._id,
      botType: id as BotType,
      enabled: !currentEnabled
    }))
    .unwrap()
    .then(() => {
      toast({
        title: `Bot ${!currentEnabled ? 'Enabled' : 'Disabled'}`,
        description: `${addOns.find((addon) => addon.botType === id)?.name} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
      });
    })
    .catch((error) => {
      // Revert the optimistic update on error
      setConfigs((prev) => ({
        ...prev,
        [id]: { ...prev[id], enabled: currentEnabled },
      }));
      
      toast({
        title: "Error",
        description: error || "Failed to toggle bot. Please try again.",
        variant: "destructive",
      });
    });
  }

  const handleEdit = (id: string) => {
    if (id === "LiquidationSnipeBot" && configs[id].status === "auto_selling") {
      setIsAutoSellDialogOpen(true)
    } else if (id === "VolumeBot") {
      setIsVolumeBotDialogOpen(true)
    } else {
      setEditingBot(id)
    }
  }

  const handleSaveEdit = (id: string, newConfig: Partial<BotConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newConfig },
    }))
    
    if (project?._id) {
      dispatch(updateBotConfig({
        projectId: project._id,
        botType: id as BotType,
        config: newConfig
      }));
    }
    
    setEditingBot(null)
  }

  const handleSave = (id: string) => {
    if (id === "LiquidationSnipeBot" && configs[id].status === "auto_selling") {
      handleSaveAutoSell({ wallets: configs[id].wallets || [] })
      return
    }
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], isEditing: false },
    }))
    toast({
      title: "Changes Saved",
      description: `${addOns.find((addon) => addon.botType === id)?.name} configuration has been updated.`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Address copied",
      description: "Deposit wallet address has been copied to clipboard",
    })
  }
  const handleSimulateAndExecute = () => {
    setIsSimulateDialogOpen(true)
  }

  const handleSimulationResult = (success: boolean) => {
    setConfigs((prev) => ({
      ...prev,
      "LiquidationSnipeBot": {
        ...prev["LiquidationSnipeBot"],
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
    // Use real wallet data if available, otherwise use placeholder data
    const wallets = project?.addons?.LiquidationSnipeBot?.subWalletIds || [];
    
    const snipedWallets = wallets.length > 0 
      ? wallets.map((wallet: any) => ({
          address: wallet.publicKey || "",
          bnbBalance: wallet.bnbBalance || 0,
          tokenBalance: wallet.tokenBalance || 0,
          sellPrice: 0,
          enabled: true,
        }))
      : [
          {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            bnbBalance: 0.15,
            tokenBalance: 50000,
            sellPrice: 0,
            enabled: true,
          },
        ];

    setConfigs((prev) => ({
      ...prev,
      "LiquidationSnipeBot": {
        ...prev["LiquidationSnipeBot"],
        status: "auto_selling" as LiquidationSnipeBotStatus,
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
        status: "ready_to_simulation" as LiquidationSnipeBotStatus,
        enabled: false,
        amount: 1000,
        nativeCurrency: 0,
        tokenAmount: 0,
        autoSell: {
          enabled: false,
          targetPrice: 0,
          stopLoss: 0,
        },
        speed: "medium" as Speed,
        maxBundleSize: 0.25,
      },
    }))
    toast({
      title: "Bot Reset",
      description: "The Liquidation & Snipe Bot has been reset and is ready for a new operation.",
    })
  }

  const handleSaveAutoSell = (newConfig: { wallets: any[] }) => {
    setConfigs((prev) => ({
      ...prev,
      "LiquidationSnipeBot": { ...prev["LiquidationSnipeBot"], wallets: newConfig.wallets },
    }))
  }

  const handleSaveVolumeBotConfig = (newConfig: { speed: Speed; maxBundleSize: number }) => {
    setConfigs((prev) => ({
      ...prev,
      "VolumeBot": { ...prev["VolumeBot"], ...newConfig },
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Add-Ons & Configuration</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWalletBalances}
              disabled={isRefreshingBalances}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingBalances ? "animate-spin" : ""}`} />
              {isRefreshingBalances ? "Refreshing..." : "Refresh Balances"}
            </Button>
          </div>
          <div className="flex flex-row gap-6 overflow-x-auto pb-4">
            {addOns.map((addon) => (
              <Card key={addon.botType} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{addon.name}</CardTitle>
                    {addon.botType === "LiquidationSnipeBot" && (
                      <Badge
                        variant={getBadgeVariant(configs[addon.botType].enabled ? "active" : "inactive")} className="font-medium text-sm px-3 py-1 rounded-full"
                      >
                        {configs[addon.botType].status === "ready_to_simulation" && "Ready to Simulate"}
                        {configs[addon.botType].status === "simulating" && "Simulating"}
                        {configs[addon.botType].status === "simulation_failed" && "Simulation Failed"}
                        {configs[addon.botType].status === "simulation_succeeded" && "Simulation Succeeded"}
                        {configs[addon.botType].status === "sniping" && "Sniping"}
                        {configs[addon.botType].status === "snipe_succeeded" && "Snipe Succeeded"}
                        {configs[addon.botType].status === "snipe_failed" && "Snipe Failed"}
                        {configs[addon.botType].status === "auto_selling" && "Auto Selling"}
                        {configs[addon.botType].status === "selling" && "Selling"}
                        {configs[addon.botType].status === "sell_failed" && "Sell Failed"}
                        {configs[addon.botType].status === "sell_succeeded" && "Sell Succeeded"}
                        {configs[addon.botType].status === "Inactive" && "Inactive"}
                      </Badge>
                    )}
                    {addon.botType !== "LiquidationSnipeBot" && (
                      <Badge variant={getBadgeVariant(configs[addon.botType].enabled ? "active" : "inactive")} className="font-medium text-sm px-3 py-1 rounded-full" >
                        {configs[addon.botType].enabled ? "Active" : "Inactive"}
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
                    <Label htmlFor={`${addon.botType}-toggle`}>Enable</Label>
                    <Switch
                      id={`${addon.botType}-toggle`}
                      checked={configs[addon.botType].enabled}
                      onCheckedChange={() => handleToggle(addon.botType)}
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
                            
                            {/* Only show download button for project owners */}
                            {isProjectOwner && (
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
                            )}
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
                      {addon.botType === "LiquidationSnipeBot" && addon.balances.token !== undefined && (
                        <div>
                          <Label>Token Balance</Label>
                          <p className="text-xl font-bold">{formatNumber(addon.balances.token)} {project?.symbol || project.name}</p>
                        </div>
                      )}
                      {addon.botType === "VolumeBot" && addon.generatedVolume !== undefined && (
                        <div>
                          <Label>Generated Volume</Label>
                          <p className="text-xl font-bold">${formatNumber(addon.generatedVolume)}</p>
                        </div>
                      )}
                      {addon.botType === "HolderBot" && addon.generatedHolders !== undefined && (
                        <div>
                          <Label>Generated Holders</Label>
                          <p className="text-xl font-bold">{addon.generatedHolders}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                  {configs[addon.botType].status === "snipe_succeeded" && (
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Sniped Wallets</h3>
                        <Button variant="outline" size="sm" onClick={() => handleMigrateToAutoSell()}>
                          Migrate to Auto Sell
                        </Button>
                      </div>
                    </div>
                  )}
                  {configs[addon.botType].status === "ready_to_simulation" && (
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Snipe Configuration</h3>
                      </div>
                    </div>
                  )}
                  {configs[addon.botType].status === "auto_selling" && (
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Auto Sell Configuration</h3>
                      </div>
                    </div>
                  )}
                  {configs[addon.botType].status === "sell_succeeded" && (
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">All Tokens Sold</h3>
                      </div>
                    </div>
                  )}
                  {addon.botType === "HolderBot" ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Please deposit BNB to the wallet address above and click Execute to start generating holders.
                      </p>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(addon.botType)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </>
                  ) : addon.botType === "LiquidationSnipeBot" ? (
                    <>
                      {(configs[addon.botType].status === "snipe_succeeded" || configs[addon.botType].status === "auto_selling") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(addon.botType)}
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                      {configs[addon.botType].status === "ready_to_simulation" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => setIsSimulateDialogOpen(true)}
                        >
                          Simulate & Execute
                        </Button>
                      )}
                      {configs[addon.botType].status === "snipe_succeeded" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={handleMigrateToAutoSell}
                        >
                          Migrate to Auto Sell Bot
                        </Button>
                      )}
                      {configs[addon.botType].status === "snipe_failed" && (
                        <Button
                          className="w-full mt-2 hover:bg-destructive/90 transition-colors"
                          onClick={() => setIsSimulateDialogOpen(true)}
                        >
                          Retry Sniping
                        </Button>
                      )}
                      {configs[addon.botType].status === "auto_selling" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => handleEdit(addon.botType)}
                        >
                          Manage Auto Sell
                        </Button>
                      )}
                      {configs[addon.botType].status === "sell_succeeded" && (
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => handleReset(addon.botType)}
                        >
                          Reset Bot
                        </Button>
                      )}
                      {configs[addon.botType].status === "Inactive" && (
                        <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please deposit enough BNN and tokens to the wallet address above in order to use this bot.
                        </p>
                        <Button
                          className="w-full mt-2 hover:bg-primary/90 transition-colors"
                          onClick={() => setIsSimulateDialogOpen(true)}
                        >
                          Configure & Execute
                        </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Please deposit BNB to the wallet address above and click Execute to start generating volume.
                    </p>
                      <Button
                        className="w-full mt-2 hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(addon.botType)}
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
              botName={addOns.find((a) => a.botType === editingBot)?.name || ""}
              config={configs[editingBot]}
              onSave={(newConfig) => handleSaveEdit(editingBot, newConfig)}
            />
          )}
    
          <SimulateAndExecuteDialog
            open={isSimulateDialogOpen}
            onOpenChange={setIsSimulateDialogOpen}
            onSimulationResult={handleSimulationResult}
          />

          {isAutoSellDialogOpen && (
            <AutoSellBotDialog
              open={isAutoSellDialogOpen}
              onOpenChange={setIsAutoSellDialogOpen}
              config={configs["LiquidationSnipeBot"]}
              onSave={(newConfig) => handleSaveAutoSell(newConfig)}
            />
          )}
        </>
      )}
    </div>
  )
}

