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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState("")
  const [network, setNetwork] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate backend validation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock successful validation
    const mockTokenDetails = {
      name: "Sample Token",
      symbol: "SMPL",
      totalSupply: "1,000,000,000",
      launchDate: "2023-07-01",
    }

    setLoading(false)
    setStep(2)
  }

  const handleConfirm = () => {
    // Here you would typically send the data to your backend
    toast({
      title: "Project Created",
      description: "Your new project has been successfully added.",
    })
    onOpenChange(false)
    setStep(1)
    setContractAddress("")
    setNetwork("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new token contract to create a project.</DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contractAddress" className="text-right">
                  Contract Address
                </Label>
                <Input
                  id="contractAddress"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="network" className="text-right">
                  Network
                </Label>
                <Select onValueChange={setNetwork} required>
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
                    Validating
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <div className="rounded-lg border bg-muted p-4 mb-4">
              <h4 className="font-semibold mb-2">Token Details</h4>
              <p>
                <strong>Name:</strong> Sample Token
              </p>
              <p>
                <strong>Symbol:</strong> SMPL
              </p>
              <p>
                <strong>Total Supply:</strong> 1,000,000,000
              </p>
              <p>
                <strong>Launch Date:</strong> 2023-07-01
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" /> Confirm Project
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

