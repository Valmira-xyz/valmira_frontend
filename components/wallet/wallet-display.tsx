"use client"

import { Copy, ExternalLink, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAccount, useDisconnect } from 'wagmi'


interface WalletDisplayProps {
  variant: "header" | "sidebar"
}

export function WalletDisplay({ variant }: WalletDisplayProps) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()

  // Format address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Generate a color based on the address for the avatar
  const generateAvatarColor = (address: string) => {
    const hash = address.split("").reduce((a, b) => {
      return ((a << 5) - a + b.charCodeAt(0)) | 0
    }, 0)
    return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`
  }

  const avatarColor = generateAvatarColor(address || "")

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback style={{ backgroundColor: avatarColor }}>
            {address?.substring(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs font-medium">{formatAddress(address || "")}</span>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => disconnect()}>
          <LogOut className="h-3 w-3" />
          <span className="sr-only">Disconnect</span>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full h-8 gap-2 pl-2 pr-3">
          <Avatar className="h-6 w-6 border-2 border-primary/20">
            <AvatarFallback style={{ backgroundColor: avatarColor }}>
              {address?.substring(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs">{formatAddress(address || "")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

