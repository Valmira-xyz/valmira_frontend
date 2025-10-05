import { Copy, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatAddress, getBlockExplorerUrl } from '@/lib/utils';

interface AddressDisplayProps {
  address: string;
  label?: string;
  displayLength?: number;
  showEnd?: boolean;
  chainName?: string;
  addressType?: 'token' | 'address'; // token or address endpoint
  showExternalLink?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  label,
  displayLength = 6,
  showEnd = true,
  chainName,
  addressType = 'address',
  showExternalLink = true,
  className = '',
}: AddressDisplayProps) {
  const { toast } = useToast();

  const formattedAddress = formatAddress(address, displayLength, showEnd);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast({
      description: 'Address copied to clipboard',
      duration: 2000,
    });
  };

  const openExternalLink = () => {
    const url = getBlockExplorerUrl(address, chainName, addressType);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 truncate">
        {label && <strong className="mr-2">{label}:</strong>}
        <span className="font-mono text-sm">{formattedAddress}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={copyToClipboard}
        >
          <Copy className="h-3 w-3" />
          <span className="sr-only">Copy address</span>
        </Button>
        {showExternalLink && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={openExternalLink}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="sr-only">View on explorer</span>
          </Button>
        )}
      </div>
    </div>
  );
}
