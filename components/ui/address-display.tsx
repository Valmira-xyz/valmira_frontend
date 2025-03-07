import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AddressDisplayProps {
  address: string
  label?: string
}

export function AddressDisplay({ address, label }: AddressDisplayProps) {
  const { toast } = useToast()

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
    toast({
      description: "Address copied to clipboard",
      duration: 2000,
    })
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 truncate">
        {label && <strong className="mr-2">{label}:</strong>}
        <span className="font-mono">{formatAddress(address)}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={copyToClipboard}
      >
        <Copy className="h-3 w-3" />
        <span className="sr-only">Copy address</span>
      </Button>
    </div>
  )
} 