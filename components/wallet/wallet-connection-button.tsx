"use client"

import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { web3modal } from "../providers"

export function WalletConnectionButton() {

  return (
    <Button onClick={() => web3modal.open() } className="bg-primary hover:bg-primary/90">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}

