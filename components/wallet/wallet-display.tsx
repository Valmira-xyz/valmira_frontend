'use client';

import { useDispatch } from 'react-redux';

import { Copy, LogOut } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateAvatarColor } from '@/lib/utils';
import { logout } from '@/store/slices/authSlice';
import { useToast } from '@/components/ui/use-toast';
interface WalletDisplayProps {
  variant: 'header' | 'sidebar' | 'simple';
}

export function WalletDisplay({ variant }: WalletDisplayProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const dispatch = useDispatch();
  const { toast } = useToast();
  // Format address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const avatarColor = generateAvatarColor(address || '');

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: 'Copied to clipboard',
        description: 'Address copied to clipboard',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      dispatch(logout());
      disconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback style={{ backgroundColor: avatarColor }}>
            {address?.substring(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col cursor-pointer" onClick={copyAddress}>
          <span className="text-xs font-medium">
            {formatAddress(address || '')}
          </span>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
        <Button
          variant="secondary"
          className="ml-auto h-6 w-6"
          onClick={handleDisconnect}
        >
          <LogOut className="h-3 w-3" />
          <span className="sr-only">Disconnect</span>
        </Button>
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback style={{ backgroundColor: avatarColor }}>
            {address?.substring(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col cursor-pointer" onClick={copyAddress}>
          <span className="text-xs font-medium">
            {formatAddress(address || '')}
          </span>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="rounded-full h-8 gap-2 pl-2 pr-3"
        >
          <Avatar className="h-6 w-6 border-2 border-primary/20">
            <AvatarFallback style={{ backgroundColor: avatarColor }}>
              {address?.substring(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs">{formatAddress(address || '')}</span>
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
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
