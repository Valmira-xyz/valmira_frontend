"use client"

import { CardFooter } from "@/components/ui/card"

import { useEffect } from "react"
import { ArrowRight, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletConnectionButton } from "@/components/wallet/wallet-connection-button"

export function WalletConnectionCTA({
  onConnect,
}: {
  onConnect: (address: string) => void
}) {
  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnected = (event: Event) => {
      const customEvent = event as CustomEvent<{ address: string }>
      onConnect(customEvent.detail.address)
    }

    window.addEventListener("walletConnected", handleWalletConnected)
    return () => {
      window.removeEventListener("walletConnected", handleWalletConnected)
    }
  }, [onConnect])

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Valmira.xyz</CardTitle>
        <CardDescription>Connect your wallet to start managing your crypto projects and trading bots</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium">Connect Your Wallet</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Connect your wallet to access all features and manage your projects.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium">Start Managing Projects</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Create and manage projects, deploy trading bots, and track performance.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center md:justify-start">
        <WalletConnectionButton />
      </CardFooter>
    </Card>
  )
}

