"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, AlertCircle, ChevronDown, Globe, Send, Twitter, Copy, ExternalLink } from "lucide-react"
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
import { TokenDeploymentService, createProject } from "@/services/deployTokenService"
import { useWalletClient, usePublicClient, useChainId } from "wagmi"
import { useEthersSigner } from "@/lib/ether-adapter"

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
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId });
  const [deploymentStatusText, setDeploymentStatusText] = useState<string>("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  // State for deploying new token
  const [newTokenName, setNewTokenName] = useState("")
  const [newTokenSymbol, setNewTokenSymbol] = useState("")
  const [newTokenTotalSupply, setNewTokenTotalSupply] = useState("")
  const [newTokenBuyTax, setNewTokenBuyTax] = useState("")
  const [newTokenSellTax, setNewTokenSellTax] = useState("")
  const [newTokenMaxHoldingRate, setNewTokenMaxHoldingRate] = useState("")
  const [newTokenMaxBuySellRate, setNewTokenMaxBuySellRate] = useState("")
  const [tokenTemplate, setTokenTemplate] = useState("0")
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string | null>(null)
  const [pairAddress, setPairAddress] = useState<string | null>(null)

  // Add social links state
  const [website, setWebsite] = useState("")
  const [telegram, setTelegram] = useState("")
  const [discord, setDiscord] = useState("")
  const [twitter, setTwitter] = useState("")

  // State for deploying new token
  const [deploymentStatus, setDeploymentStatus] = useState<TokenDeploymentStatus>("idle")
  const [deploymentError, setDeploymentError] = useState("")

  // State for importing existing token
  const [existingContractAddress, setExistingContractAddress] = useState("")
  const [existingNetwork, setExistingNetwork] = useState("bsc")
  const [importStatus, setImportStatus] = useState<TokenImportStatus>("idle")
  const [analyzedToken, setAnalyzedToken] = useState<any>(null)
  const [importError, setImportError] = useState("")

  const validateTokenInputs = () => {
    const errors: string[] = [];

    // Validate name
    if (!newTokenName || newTokenName.length < 3 || newTokenName.length > 50) {
      errors.push("Token name must be between 3 and 50 characters");
    }

    // Validate symbol
    if (!newTokenSymbol || newTokenSymbol.length < 2 || newTokenSymbol.length > 10) {
      errors.push("Token symbol must be between 2 and 10 characters");
    }

    // Validate total supply
    const totalSupply = parseFloat(newTokenTotalSupply);
    if (isNaN(totalSupply) || totalSupply <= 0 || totalSupply > 1e18) {
      errors.push("Total supply must be between 0 and 1e18");
    }

    // Validate fees
    const buyTax = parseFloat(newTokenBuyTax);
    const sellTax = parseFloat(newTokenSellTax);
    if (isNaN(buyTax) || buyTax < 0 || buyTax > 25) {
      errors.push("Buy tax must be between 0 and 25");
    }
    if (isNaN(sellTax) || sellTax < 0 || sellTax > 25) {
      errors.push("Sell tax must be between 0 and 25");
    }

    // Validate limits
    const maxHolding = parseFloat(newTokenMaxHoldingRate);
    const maxBuySell = parseFloat(newTokenMaxBuySellRate);
    if (isNaN(maxHolding) || maxHolding <= 0 || maxHolding > 100) {
      errors.push("Max holding rate must be between 0 and 100");
    }
    if (isNaN(maxBuySell) || maxBuySell <= 0 || maxBuySell > 100) {
      errors.push("Max buy/sell rate must be between 0 and 100");
    }

    // Validate social links
    if (website && !isValidUrl(website)) {
      errors.push("Invalid website URL");
    }
    if (telegram && !isValidUrl(telegram)) {
      errors.push("Invalid Telegram URL");
    }
    if (discord && !isValidUrl(discord)) {
      errors.push("Invalid Discord URL");
    }
    if (twitter && !isValidUrl(twitter)) {
      errors.push("Invalid Twitter URL");
    }

    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeployNewToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicClient || !walletClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    const errors = validateTokenInputs();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }

    // Get the connected wallet address
    if (!walletClient) {
      toast({
        title: "Error",
        description: "Failed to get wallet address",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatusText("Initializing deployment...");

    try {
      const deploymentService = TokenDeploymentService.getInstance(publicClient, walletClient, signer);

      setDeploymentStatusText("Processing token deployment and waiting for 5 block confimration and verification on chain explorer...");
      const { contractAddress, pairAddress: newPairAddress } = await deploymentService.deployToken({
        tokenName: newTokenName,
        tokenSymbol: newTokenSymbol,
        tokenTotalSupply: newTokenTotalSupply,
        buyFee: parseFloat(newTokenBuyTax) || 0,
        sellFee: parseFloat(newTokenSellTax) || 0,
        maxHoldingLimit_: parseFloat(newTokenMaxHoldingRate) || 0,
        maxBuyLimit_: parseFloat(newTokenMaxBuySellRate) || 0,
        maxSellLimit_: parseFloat(newTokenMaxBuySellRate) || 0,
        socialLinks: {
          website: website || "",
          telegram: telegram || "",
          discord: discord || "",
          twitter: twitter || ""
        },
        templateNumber: parseInt(tokenTemplate)
      });

      setDeployedTokenAddress(contractAddress);
      setPairAddress(newPairAddress);
      setDeploymentStatusText("Token is deployed and verified successfully.");

      setIsDeploying(false);

    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentStatusText("Deployment failed");
      setIsDeploying(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deploy token. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    if (!deployedTokenAddress) {
      toast({
        title: "Error",
        description: "Please deploy a token first",
        variant: "destructive",
      })
      return
    }


    if (!walletClient) {
      toast({
        title: "Error",
        description: "Failed to get wallet address",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProject(true)
    
    try {
      const projectData = {
        name: newTokenName,
        tokenAddress: deployedTokenAddress,
        chainId: chainId,
        pairAddress: pairAddress || "",
        tokenData: {
          name: newTokenName,
          symbol: newTokenSymbol,
          decimals: 18,
          totalSupply: newTokenTotalSupply,
          websiteLink: website,
          telegramLink: telegram,
          twitterLink: twitter,
          discordLink: discord,
          buyFee: parseFloat(newTokenBuyTax),
          sellFee: parseFloat(newTokenSellTax),
          maxHoldingLimit_: parseFloat(newTokenMaxHoldingRate),
          maxBuyLimit_: parseFloat(newTokenMaxBuySellRate),
          maxSellLimit_: parseFloat(newTokenMaxBuySellRate),
          templateNumber: parseInt(tokenTemplate)
        }
      }

      const {status, message, project} = await createProject(projectData)

      if (status === "success") {
        toast({
          title: "Success",
          description: "Project created successfully",
        })

        console.log("project : ", project)

        setIsCreatingProject(false)
        // Reset form and close modal
        resetForm()
        onClose()
      } else {
        setIsCreatingProject(false)
        throw new Error(message || "Failed to create project")
      }
    } catch (error) {
      setIsCreatingProject(false)
      console.error("Project creation error:", error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
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
    setDeploymentStatusText("idle")
    setDeployedTokenAddress(null)
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
      onOpenChange={(open: boolean) => {
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
              <div className={`grid grid-cols-4 gap-4 py-4`}>
                <div className="col-span-2 flex flex-col gap-x-8 gap-4">
                  <div className="flex gap-2 justify-between">
                    <div className="space-y-2">
                      <Label htmlFor="newTokenName">Token Name</Label>
                      <Input
                        id="newTokenName"
                        value={newTokenName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenName(e.target.value)}
                        required
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newTokenSymbol">Token Symbol</Label>
                      <Input
                        id="newTokenSymbol"
                        value={newTokenSymbol}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenSymbol(e.target.value)}
                        required
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newTokenTotalSupply">Total Supply</Label>
                    <Input
                      id="newTokenTotalSupply"
                      type="number"
                      value={newTokenTotalSupply}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenTotalSupply(e.target.value)}
                      required
                      disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                    />
                  </div>
                  <div className="flex gap-2 justify-between w-full">
                    <div className="space-y-2 w-1/2">
                      <Label htmlFor="newTokenBuyTax">Buy Tax (%)</Label>
                      <Input
                        id="newTokenBuyTax"
                        type="number"
                        className="w-full"
                        value={newTokenBuyTax}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenBuyTax(e.target.value)}
                        required
                        min="0"
                        max="10"
                        step="0.1"
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                    <div className="space-y-2 w-1/2">
                      <Label htmlFor="newTokenSellTax">Sell Tax (%)</Label>
                      <Input
                        id="newTokenSellTax"
                        type="number"
                        className="w-full"
                        value={newTokenSellTax}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenSellTax(e.target.value)}
                        required
                        min="0"
                        max="10"
                        step="0.1"
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                  </div>
                  <div className=" flex gap-2 justify-between">
                    <div className="space-y-2 flex flex-col justify-start">
                      <Label htmlFor="newTokenMaxHoldingRate">Max Holding (% of Total Supply)</Label>
                      <Input
                        id="newTokenMaxHoldingRate"
                        type="number"
                        value={newTokenMaxHoldingRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenMaxHoldingRate(e.target.value)}
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                    <div className="space-y-2 flex flex-col justify-start">
                      <Label htmlFor="newTokenMaxBuySellRate">Max Buy/Sell (% of Total Supply)</Label>
                      <Input
                        id="newTokenMaxBuySellRate"
                        type="number"
                        value={newTokenMaxBuySellRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenMaxBuySellRate(e.target.value)}
                        required
                        min="0"
                        max="5"
                        step="0.1"
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <Collapsible open={showSocialLinks} onOpenChange={setShowSocialLinks}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex w-full justify-between"
                        disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
                            disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelegram(e.target.value)}
                            disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscord(e.target.value)}
                            disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwitter(e.target.value)}
                            disabled={deploymentStatusText === "deploying" || deploymentStatusText === "success"}
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {deployedTokenAddress && (
                    <div className="mt-4 space-y-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Token Deployed Successfully</h4>
                      </div>
                      <AddressDisplay
                        address={deployedTokenAddress}
                        label="Contract Address"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{newTokenName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Symbol</p>
                          <p className="text-sm text-muted-foreground">{newTokenSymbol}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


              </div>

              {deploymentError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{deploymentError}</AlertDescription>
                </Alert>
              )}

              {isDeploying && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deployment Status</span>
                    <span className="text-sm text-muted-foreground">{deploymentStatusText}</span>
                  </div>
                </div>
              )}


              <DialogFooter className="mt-4">
                {!deployedTokenAddress ? (
                  <Button type="submit" disabled={isDeploying}>
                    {isDeploying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Doing deploy and verify
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExistingContractAddress(e.target.value)}
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

