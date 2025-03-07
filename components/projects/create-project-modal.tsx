"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, AlertCircle, ChevronDown, Globe, Send, Twitter } from "lucide-react"
import { FaDiscord } from "react-icons/fa"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddressDisplay } from "@/components/ui/address-display"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

type TokenDeploymentStatus = "idle" | "deploying" | "success" | "error"
type TokenImportStatus = "idle" | "validating" | "valid" | "invalid"

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [activeTab, setActiveTab] = useState("deploy")
  const { toast } = useToast()
  const [showSocialLinks, setShowSocialLinks] = useState(false)

  // State for deploying new token
  const [newTokenName, setNewTokenName] = useState("")
  const [newTokenSymbol, setNewTokenSymbol] = useState("")
  const [newTokenTotalSupply, setNewTokenTotalSupply] = useState("")
  const [newTokenBuyTax, setNewTokenBuyTax] = useState("")
  const [newTokenSellTax, setNewTokenSellTax] = useState("")
  const [newTokenMaxHoldingRate, setNewTokenMaxHoldingRate] = useState("")
  const [newTokenMaxBuySellRate, setNewTokenMaxBuySellRate] = useState("")
  // Add social links state
  const [website, setWebsite] = useState("")
  const [telegram, setTelegram] = useState("")
  const [discord, setDiscord] = useState("")
  const [twitter, setTwitter] = useState("")

  // State for deploying new token
  const [deploymentStatus, setDeploymentStatus] = useState<TokenDeploymentStatus>("idle")
  const [deployedTokenAddress, setDeployedTokenAddress] = useState("")
  const [deploymentError, setDeploymentError] = useState("")

  // State for importing existing token
  const [existingContractAddress, setExistingContractAddress] = useState("")
  const [existingNetwork, setExistingNetwork] = useState("bsc")
  const [importStatus, setImportStatus] = useState<TokenImportStatus>("idle")
  const [analyzedToken, setAnalyzedToken] = useState<any>(null)
  const [importError, setImportError] = useState("")

  // State for project creation
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const handleDeployNewToken = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate percentage values
    const percentageFields = [
      { value: newTokenBuyTax, name: "Buy Tax" },
      { value: newTokenSellTax, name: "Sell Tax" },
      { value: newTokenMaxHoldingRate, name: "Max Holding Rate" },
      { value: newTokenMaxBuySellRate, name: "Max Buy/Sell Rate" }
    ]

    for (const field of percentageFields) {
      const value = parseFloat(field.value)
      if (value > 10) {
        toast({
          title: "Invalid Percentage",
          description: `${field.name} must be less than or equal to 10%`,
          variant: "destructive",
        })
        return
      }
    }

    setDeploymentStatus("deploying")
    setDeploymentError("")

    try {
      // Simulate token deployment
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful deployment
      setDeploymentStatus("success")
      setDeployedTokenAddress("0x" + Math.random().toString(16).substring(2, 42))
    } catch (error) {
      setDeploymentStatus("error")
      setDeploymentError("Failed to deploy token. Please try again.")
    }
  }

  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!existingContractAddress || !existingNetwork) {
      toast({
        title: "Missing Information",
        description: "Please provide both contract address and network.",
        variant: "destructive",
      })
      return
    }

    setImportStatus("validating")
    setImportError("")

    try {
      // Simulate token validation with backend
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful validation
      setImportStatus("valid")
      setAnalyzedToken({
        name: "Sample Token",
        symbol: "SMPL",
        decimals: 18,
        totalSupply: "1,000,000,000",
        buyTax: "5",
        sellTax: "5",
        maxHoldingRate: "2",
        maxBuySellRate: "1",
        pairAddress: "0x1234567890123456789012345678901234567890",
      })
    } catch (error) {
      setImportStatus("invalid")
      setImportError("Failed to validate token. Please check the address and try again.")
    }
  }

  const handleCreateProject = async () => {
    setIsCreatingProject(true)

    try {
      // Simulate project creation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Project Created",
        description: "Your new project has been successfully created.",
      })

      // Reset form and close modal
      resetForm()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingProject(false)
    }
  }

  const resetForm = () => {
    // Reset deploy token form
    setNewTokenName("")
    setNewTokenSymbol("")
    setNewTokenTotalSupply("")
    setNewTokenBuyTax("")
    setNewTokenSellTax("")
    setNewTokenMaxHoldingRate("")
    setNewTokenMaxBuySellRate("")
    setDeploymentStatus("idle")
    setDeployedTokenAddress("")
    setDeploymentError("")

    // Reset import token form
    setExistingContractAddress("")
    setExistingNetwork("")
    setImportStatus("idle")
    setAnalyzedToken(null)
    setImportError("")

    // Reset project creation
    setIsCreatingProject(false)

    // Reset social links
    setWebsite("")
    setTelegram("")
    setDiscord("")
    setTwitter("")
    setShowSocialLinks(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Deploy a new token or import an existing one to create a project.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deploy">Deploy New Token</TabsTrigger>
            <TabsTrigger value="import">Import Existing Token</TabsTrigger>
          </TabsList>
          <TabsContent value="deploy">
            <form onSubmit={handleDeployNewToken}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-x-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newTokenName">Token Name</Label>
                      <Input
                        id="newTokenName"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        required
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenSymbol">Token Symbol</Label>
                      <Input
                        id="newTokenSymbol"
                        value={newTokenSymbol}
                        onChange={(e) => setNewTokenSymbol(e.target.value)}
                        required
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenTotalSupply">Total Supply</Label>
                      <Input
                        id="newTokenTotalSupply"
                        type="number"
                        value={newTokenTotalSupply}
                        onChange={(e) => setNewTokenTotalSupply(e.target.value)}
                        required
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenBuyTax">Buy Tax (%)</Label>
                      <Input
                        id="newTokenBuyTax"
                        type="number"
                        value={newTokenBuyTax}
                        onChange={(e) => setNewTokenBuyTax(e.target.value)}
                        required
                        min="0"
                        max="10"
                        step="0.1"
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                      <p className="text-xs text-muted-foreground">Must be less than or equal to 10%</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newTokenSellTax">Sell Tax (%)</Label>
                      <Input
                        id="newTokenSellTax"
                        type="number"
                        value={newTokenSellTax}
                        onChange={(e) => setNewTokenSellTax(e.target.value)}
                        required
                        min="0"
                        max="10"
                        step="0.1"
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                      <p className="text-xs text-muted-foreground">Must be less than or equal to 10%</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenMaxHoldingRate">Max Holding (% of Total Supply)</Label>
                      <Input
                        id="newTokenMaxHoldingRate"
                        type="number"
                        value={newTokenMaxHoldingRate}
                        onChange={(e) => setNewTokenMaxHoldingRate(e.target.value)}
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                      <p className="text-xs text-muted-foreground">Maximum amount a wallet can hold (must be ≤ 5% of total supply)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenMaxBuySellRate">Max Buy/Sell (% of Total Supply)</Label>
                      <Input
                        id="newTokenMaxBuySellRate"
                        type="number"
                        value={newTokenMaxBuySellRate}
                        onChange={(e) => setNewTokenMaxBuySellRate(e.target.value)}
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                      />
                      <p className="text-xs text-muted-foreground">Maximum amount per transaction (must be ≤ 5% of total supply)</p>
                    </div>
                  </div>
                </div>

                <Collapsible open={showSocialLinks} onOpenChange={setShowSocialLinks}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex w-full justify-between"
                      disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                    >
                      <span>Social Links</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showSocialLinks && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram" className="flex items-center gap-2">
                          <Send className="h-4 w-4" /> Telegram
                        </Label>
                        <Input
                          id="telegram"
                          type="url"
                          placeholder="https://t.me/"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discord" className="flex items-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <FaDiscord size={16} />
                          </div>
                          Discord
                        </Label>
                        <Input
                          id="discord"
                          type="url"
                          placeholder="https://discord.gg/"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" /> Twitter
                        </Label>
                        <Input
                          id="twitter"
                          type="url"
                          placeholder="https://twitter.com/"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          disabled={deploymentStatus === "deploying" || deploymentStatus === "success"}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {deploymentError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{deploymentError}</AlertDescription>
                </Alert>
              )}

              {deploymentStatus === "success" && (
                <div className="mb-4 p-4 border rounded-md bg-muted">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold mb-2">Token Deployed Successfully</h4>
                      <AddressDisplay 
                        address={deployedTokenAddress} 
                        label="Contract Address" 
                      />
                      <p className="mb-2">
                        <strong>Name:</strong> {newTokenName}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <strong>Symbol:</strong> {newTokenSymbol}
                      </p>
                      <p>
                        <strong>Total Supply:</strong> {newTokenTotalSupply}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                {deploymentStatus !== "success" ? (
                  <Button type="submit" disabled={deploymentStatus === "deploying"}>
                    {deploymentStatus === "deploying" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying
                      </>
                    ) : (
                      "Deploy Token"
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleCreateProject} disabled={isCreatingProject}>
                    {isCreatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="import">
            <form onSubmit={handleImportToken}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-x-8">
                  <div className="space-y-2">
                    <Label htmlFor="existingContractAddress">Contract Address</Label>
                    <Input
                      id="existingContractAddress"
                      value={existingContractAddress}
                      onChange={(e) => setExistingContractAddress(e.target.value)}
                      required
                      disabled={importStatus === "validating" || importStatus === "valid"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existingNetwork">Network</Label>
                    <Select onValueChange={setExistingNetwork} value={existingNetwork} disabled={true}>
                      <SelectTrigger>
                        <SelectValue placeholder="BSC (Binance Smart Chain)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bsc">BSC (Binance Smart Chain)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Currently, only BSC network is supported.</p>
                  </div>
                </div>
              </div>

              {importError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              {importStatus !== "valid" ? (
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={importStatus === "validating" || !existingContractAddress || !existingNetwork}
                  >
                    {importStatus === "validating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating
                      </>
                    ) : (
                      "Validate Token"
                    )}
                  </Button>
                </DialogFooter>
              ) : null}
            </form>

            {analyzedToken && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Token Details</h4>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted">
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong> {analyzedToken.name}
                    </p>
                    <p>
                      <strong>Symbol:</strong> {analyzedToken.symbol}
                    </p>
                    <p>
                      <strong>Decimals:</strong> {analyzedToken.decimals}
                    </p>
                    <p>
                      <strong>Total Supply:</strong> {analyzedToken.totalSupply}
                    </p>
                    <p>
                      <strong>Buy Tax:</strong> {analyzedToken.buyTax}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <strong>Sell Tax:</strong> {analyzedToken.sellTax}%
                    </p>
                    <p>
                      <strong>Max Holding Rate:</strong> {analyzedToken.maxHoldingRate}%
                    </p>
                    <p>
                      <strong>Max Buy/Sell Rate:</strong> {analyzedToken.maxBuySellRate}%
                    </p>
                    <AddressDisplay 
                      address={analyzedToken.pairAddress} 
                      label="Pair Address" 
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleCreateProject} disabled={isCreatingProject}>
                    {isCreatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

