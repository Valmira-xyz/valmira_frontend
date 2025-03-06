"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useWallet } from "@/components/wallet/wallet-provider"
import { WalletDisplay } from "@/components/wallet/wallet-display"
import { WalletConnectionButton } from "@/components/wallet/wallet-connection-button"

export function DashboardHeader() {
  const { isConnected, walletAddress, onDisconnect } = useWallet()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4 px-6">
        <SidebarTrigger className="relative z-20" />
        <div className="hidden lg:flex lg:w-[450px]">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search projects..." className="w-full pl-8 bg-background" />
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4 px-6">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {isConnected ? (
          <WalletDisplay address={walletAddress} variant="header" onDisconnect={onDisconnect} />
        ) : (
          <WalletConnectionButton />
        )}
      </div>
    </header>
  )
} 