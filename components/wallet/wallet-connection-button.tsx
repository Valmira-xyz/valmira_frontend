'use client';

import { Wallet } from 'lucide-react';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AuthResponse } from '@/types';

import { web3modal } from '../providers';

interface WalletConnectionButtonProps {
  variant?: ButtonProps['variant'];
  className?: string;
  buttonText?: string;
  onAuthSuccess?: (authResponse: AuthResponse) => void;
  onAuthError?: (error: unknown) => void;
}

export function WalletConnectionButton({
  variant = 'default',
  className,
  buttonText = 'Connect Wallet',
}: WalletConnectionButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => web3modal.open()}
      className={cn('', className)}
    >
      <Wallet className="h-4 w-4" />
      {buttonText}
    </Button>
  );
}
