"use client"

import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { web3modal } from "../providers"
import { useDispatch } from "react-redux"
import { setUser } from "@/store/authSlice"
import { authService } from "@/services/authService"
import { useEffect } from "react"
import { useAccount } from "wagmi"

export function WalletConnectionButton() {
  const dispatch = useDispatch()
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const handleAuthentication = async () => {
      if (isConnected && address) {
        try {
          // Get nonce from backend
          const nonce = await authService.getNonce(address)
          
          // In a real implementation, you would sign the nonce here
          // For now, we'll use a mock signature
          const mockSignature = "0x" + "1".repeat(130)
          
          // Verify signature and get user data
          const authResponse = await authService.verifySignature(address, mockSignature, nonce)
          
          // Update Redux store with user data
          dispatch(setUser(authResponse.user))
        } catch (error) {
          console.error('Authentication error:', error)
        }
      }
    }

    handleAuthentication()
  }, [isConnected, address, dispatch])

  return (
    <Button onClick={() => web3modal.open()} className="bg-primary hover:bg-primary/90">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}

