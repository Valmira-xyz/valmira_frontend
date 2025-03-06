"use client"

import type React from "react"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
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

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [activeTab, setActiveTab] = useState("deploy")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // State for deploying new token
  const [newTokenName, setNewTokenName] = useState("")
  const [newTokenSymbol, setNewTokenSymbol] = useState("")
  const [newTokenDecimals, setNewTokenDecimals] = useState("")
  const [newTokenTotalSupply, setNewTokenTotalSupply] = useState("")
  const [newTokenBuyTax, setNewTokenBuyTax] = useState("")
  const [newTokenSellTax, setNewTokenSellTax] = useState("")

  // State for importing existing token
  const [existingContractAddress, setExistingContractAddress] = useState("")
  const [existingNetwork, setExistingNetwork] = useState("")
  const [analyzedToken, setAnalyzedToken] = useState<any>(null)

  const handleDeployNewToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate token deployment
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    toast({
      title: "Token Deployed",
      description: "Your new token has been successfully deployed.",
    })
    onClose()
  }

  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate token analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setAnalyzedToken({
      name: "Sample Token",
      symbol: "SMPL",
      decimals: 18,
      totalSupply: "1,000,000,000",
      pairAddress: "0x1234567890123456789012345678901234567890",
      buyTax: "5",
      sellTax: "5",
    })
    setLoading(false)
  }

  const handleConfirmImport = () => {
    toast({
      title: "Token Imported",
      description: "The existing token has been successfully imported.",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenName" className="text-right">
                    Token Name
                  </Label>
                  <Input
                    id="newTokenName"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenSymbol" className="text-right">
                    Token Symbol
                  </Label>
                  <Input
                    id="newTokenSymbol"
                    value={newTokenSymbol}
                    onChange={(e) => setNewTokenSymbol(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenDecimals" className="text-right">
                    Decimals
                  </Label>
                  <Input
                    id="newTokenDecimals"
                    type="number"
                    value={newTokenDecimals}
                    onChange={(e) => setNewTokenDecimals(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenTotalSupply" className="text-right">
                    Total Supply
                  </Label>
                  <Input
                    id="newTokenTotalSupply"
                    type="number"
                    value={newTokenTotalSupply}
                    onChange={(e) => setNewTokenTotalSupply(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenBuyTax" className="text-right">
                    Buy Tax (%)
                  </Label>
                  <Input
                    id="newTokenBuyTax"
                    type="number"
                    value={newTokenBuyTax}
                    onChange={(e) => setNewTokenBuyTax(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTokenSellTax" className="text-right">
                    Sell Tax (%)
                  </Label>
                  <Input
                    id="newTokenSellTax"
                    type="number"
                    value={newTokenSellTax}
                    onChange={(e) => setNewTokenSellTax(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying
                    </>
                  ) : (
                    "Deploy Token"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="import">
            <form onSubmit={handleImportToken}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="existingContractAddress" className="text-right">
                    Contract Address
                  </Label>
                  <Input
                    id="existingContractAddress"
                    value={existingContractAddress}
                    onChange={(e) => setExistingContractAddress(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="existingNetwork" className="text-right">
                    Network
                  </Label>
                  <Select onValueChange={setExistingNetwork} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    "Analyze Token"
                  )}
                </Button>
              </DialogFooter>
            </form>
            {analyzedToken && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Analyzed Token Details</h4>
                <div className="grid gap-2">
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
                    <strong>Pair Address:</strong> {analyzedToken.pairAddress}
                  </p>
                  <p>
                    <strong>Buy Tax:</strong> {analyzedToken.buyTax}%
                  </p>
                  <p>
                    <strong>Sell Tax:</strong> {analyzedToken.sellTax}%
                  </p>
                </div>
                <Button onClick={handleConfirmImport} className="mt-4">
                  <Check className="mr-2 h-4 w-4" /> Import Token
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

