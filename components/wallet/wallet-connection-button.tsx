'use client';

import { Wallet } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { web3modal } from '../providers';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { AuthResponse } from '@/types';

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
  onAuthSuccess,
  onAuthError,
}: WalletConnectionButtonProps) {
  const dispatch = useDispatch();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const authenticateUser = async () => {
      if (isConnected && address) {
        try {
          const nonce = await authService.getNonce(address);
          const mockSignature = '0x' + '1'.repeat(130);
          const authResponse = await authService.verifySignature(
            address,
            mockSignature,
            nonce.nonce
          );

          if (onAuthSuccess) {
            onAuthSuccess(authResponse);
          } else {
            dispatch(setUser(authResponse.user));
          }
        } catch (error) {
          console.error('Authentication error:', error);
          if (onAuthError) {
            onAuthError(error);
          }
        }
      }
    };

    authenticateUser();
  }, [isConnected, address, dispatch, onAuthSuccess, onAuthError]);

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
