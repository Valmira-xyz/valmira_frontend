"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WalletConnectionDialog } from "@/components/wallet/wallet-connection-dialog"
import { useWallet } from "@/components/wallet/wallet-provider"

export function WalletConnectionButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { isConnected, walletAddress, onConnect, onDisconnect } = useWallet()

  const handleConnect = () => {
    if (isConnected) {
      setIsDialogOpen(true)
    } else {
      setIsDialogOpen(true)
    }
  }

  const handleDisconnect = () => {
    onDisconnect()
    setIsDialogOpen(false)
  }

  return (
    <>
      <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90">
        <Wallet className="mr-2 h-4 w-4" />
        {isConnected ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
      </Button>

      <WalletConnectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConnect={onConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
      />
    </>
  )
}

