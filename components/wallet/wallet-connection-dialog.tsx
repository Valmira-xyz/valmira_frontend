"use client"

import { useState } from "react"
import { Check, Loader2, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Mock wallet providers
const walletProviders = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect to your MetaMask Wallet",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    description: "Scan with WalletConnect to connect",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🪙",
    description: "Connect to your Coinbase Wallet",
  },
]

type WalletConnectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (address: string) => void
  onDisconnect: () => void
  isConnected: boolean
}

export function WalletConnectionDialog({
  open,
  onOpenChange,
  onConnect,
  onDisconnect,
  isConnected,
}: WalletConnectionDialogProps) {
  const [connecting, setConnecting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  // Generate a mock wallet address
  const generateMockAddress = () => {
    const chars = "0123456789abcdef"
    let address = "0x"
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)]
    }
    return address
  }

  const handleConnect = (providerId: string) => {
    setSelectedProvider(providerId)
    setConnecting(true)

    // Simulate connection delay
    setTimeout(() => {
      const mockAddress = generateMockAddress()

      // Get the onConnect function from the parent component
      onConnect(mockAddress)

      setConnecting(false)
      onOpenChange(false)

      // Reset state after closing
      setTimeout(() => {
        setSelectedProvider(null)
      }, 500)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {isConnected ? "Switch Wallet" : "Connect Your Wallet"}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? "Choose a different wallet to connect or disconnect your current wallet."
              : "Connect your wallet to access all features and manage your projects."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {walletProviders.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              className="flex items-center justify-between h-14 px-4"
              disabled={connecting}
              onClick={() => handleConnect(provider.id)}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{provider.icon}</div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-xs text-muted-foreground">{provider.description}</span>
                </div>
              </div>

              {connecting && selectedProvider === provider.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : selectedProvider === provider.id ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : null}
            </Button>
          ))}
        </div>

        {isConnected && (
          <Button variant="destructive" onClick={onDisconnect} className="mt-4">
            Disconnect Current Wallet
          </Button>
        )}

        <div className="flex flex-col text-center text-xs text-muted-foreground">
          <p>By connecting your wallet, you agree to our</p>
          <p>
            <a href="/terms" className="underline hover:text-primary">
              Terms of Service
            </a>
            {" and "}
            <a href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

