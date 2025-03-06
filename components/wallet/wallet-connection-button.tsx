"use client"

import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWeb3Modal } from '@web3modal/react'

export function WalletConnectionButton() {
  const { open } = useWeb3Modal()

  return (
    <Button onClick={() => open()} className="bg-primary hover:bg-primary/90">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}

