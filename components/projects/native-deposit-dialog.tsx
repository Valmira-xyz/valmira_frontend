'use client';

import { useEffect, useState } from 'react';

import { RefreshCw } from 'lucide-react';
import { useChainId } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useEthersProvider, useEthersSigner } from '@/lib/ether-adapter';
import { getChainName } from '@/lib/utils';
import {
  getNativeBalance,
  hasSufficientBalance,
  transferNativeCurrency,
} from '@/services/web3Utils';

export interface NativeDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositWalletAddress: string;
  onSuccess?: () => void;
  chainName: string;
}

export function NativeDepositDialog({
  open,
  onOpenChange,
  depositWalletAddress,
  onSuccess,
  chainName = 'BSC_MAINNET',
}: NativeDepositDialogProps) {
  const { toast } = useToast();
  const getChainIdFromName = (name: string): number => {
    switch (name) {
      case 'BSC_MAINNET':
        return 56; // BSC Mainnet
      case 'ETH_MAINNET':
        return 1; // Ethereum Mainnet
      default:
        return 1; // Default to Ethereum Mainnet
    }
  };

  const chainIdForSigner = getChainIdFromName(chainName);
  const provider = useEthersProvider({ chainId: chainIdForSigner });
  const signer = useEthersSigner({ chainId: chainIdForSigner });
  const [connectedWalletBalance, setConnectedWalletBalance] = useState<
    number | null
  >(null);
  const [depositWalletBalance, setDepositWalletBalance] = useState<
    number | null
  >(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] =
    useState<string>('');
  const chainId = useChainId();

  const nativeCurrency =
    chainName === 'BSC_MAINNET'
      ? 'BNB'
      : chainName === 'ETH_MAINNET'
        ? 'ETH'
        : 'SOL';

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Load balances when dialog opens
  useEffect(() => {
    if (open && signer) {
      refreshBalances();

      // Get connected wallet address
      const fetchWalletAddress = async () => {
        try {
          const address = await signer.getAddress();
          setConnectedWalletAddress(address);
        } catch (error) {
          console.error('Error getting wallet address:', error);
        }
      };

      fetchWalletAddress();
    }
  }, [open, signer]);

  // Refresh balances
  const refreshBalances = async () => {
    if (!signer || !provider) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsRefreshing(true);

    try {
      // Get signer address
      const address = await signer.getAddress();
      setConnectedWalletAddress(address);

      // Get connected wallet balance
      const connectedBalance = await getNativeBalance(address, chainName);
      setConnectedWalletBalance(connectedBalance);

      // Get deposit wallet balance
      const depositBalance = await getNativeBalance(
        depositWalletAddress,
        chainName
      );
      setDepositWalletBalance(depositBalance);
    } catch (error: any) {
      console.error('Error refreshing balances:', error);
      toast({
        title: error.response?.data?.errorType || 'Failed to refresh balances',
        description:
          error.response?.data?.errorMessage ||
          'Could not retrieve wallet balances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle deposit amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  // Handle max amount button
  const handleMaxAmount = () => {
    if (connectedWalletBalance !== null) {
      // Leave small amount for gas (0.005 native currency)
      const maxAmount = Math.max(connectedWalletBalance - 0.005, 0).toFixed(4);
      setDepositAmount(maxAmount);
    }
  };

  // Execute native currency transfer
  const handleTransfer = async () => {
    if (!signer || !provider) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (getChainName(chainId) !== chainName) {
      toast({
        title: 'Wrong network',
        description: `Please switch your wallet to ${chainName === 'ETH_MAINNET' ? 'Ethereum' : chainName === 'BSC_MAINNET' ? 'Binance Smart Chain' : 'Solana'} to continue.`,
        variant: 'destructive',
      });
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to deposit.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const amount = parseFloat(depositAmount);
      const signerAddress = await signer.getAddress();

      // Check if signer has sufficient balance
      const sufficient = await hasSufficientBalance(
        signerAddress,
        amount,
        chainName
      );

      if (!sufficient) {
        toast({
          title: 'Insufficient balance',
          description: `You don't have enough ${nativeCurrency} to complete this transaction.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Execute transfer
      const receipt = await transferNativeCurrency(
        signer,
        depositWalletAddress,
        amount
      );

      if (receipt) {
        toast({
          title: 'Transfer successful',
          description: `Successfully transferred ${amount} ${nativeCurrency} to the deposit wallet.`,
          variant: 'default',
        });

        // Refresh balances after successful transfer
        await refreshBalances();

        // Clear input
        setDepositAmount('');

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: error.response?.data?.errorType || 'Transfer failed',
        description:
          error.response?.data?.errorMessage ||
          `Failed to transfer ${nativeCurrency}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit {nativeCurrency}</DialogTitle>
          <DialogDescription>
            Transfer {nativeCurrency} from your connected wallet to the deposit
            wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Wallet Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {connectedWalletAddress
                      ? formatAddress(connectedWalletAddress)
                      : 'Not connected'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {connectedWalletBalance !== null
                      ? `${connectedWalletBalance.toFixed(4)} ${nativeCurrency}`
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Deposit Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAddress(depositWalletAddress)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {depositWalletBalance !== null
                      ? `${depositWalletBalance.toFixed(4)} ${nativeCurrency}`
                      : '-'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={refreshBalances}
                disabled={isRefreshing || !signer}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh Balances
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="native-amount" className="text-sm font-medium">
                {nativeCurrency} Amount
              </label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={handleMaxAmount}
                disabled={connectedWalletBalance === null}
              >
                MAX
              </button>
            </div>

            <div className="flex space-x-2">
              <Input
                id="native-amount"
                placeholder="0.0"
                value={depositAmount}
                onChange={handleAmountChange}
                disabled={isLoading || !signer}
              />
              <span className="flex items-center text-sm font-medium px-2">
                {nativeCurrency}
              </span>
            </div>

            {signer &&
              connectedWalletBalance !== null &&
              parseFloat(depositAmount || '0') >
                connectedWalletBalance - 0.0005 && (
                <p className="text-xs text-destructive">
                  Insufficient balance. Leave at least 0.0005 {nativeCurrency}{' '}
                  for gas.
                </p>
              )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              isLoading ||
              !signer ||
              !depositAmount ||
              parseFloat(depositAmount) <= 0 ||
              (connectedWalletBalance !== null &&
                parseFloat(depositAmount) > connectedWalletBalance - 0.0005)
            }
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              `Transfer ${nativeCurrency}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
