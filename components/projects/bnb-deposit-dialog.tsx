'use client';

import { useEffect, useState } from 'react';

import { RefreshCw } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { useEthersProvider, useEthersSigner } from '@/lib/ether-adapter';
import {
  getBnbBalance,
  hasSufficientBalance,
  transferBnb,
} from '@/lib/web3Utils';

export interface BnbDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositWalletAddress: string;
  onSuccess?: () => void;
}

export function BnbDepositDialog({
  open,
  onOpenChange,
  depositWalletAddress,
  onSuccess,
}: BnbDepositDialogProps) {
  const { toast } = useToast();
  const provider = useEthersProvider({});
  const signer = useEthersSigner({});
  console.log('[BnbDepositDialog] depositWalletAddress', depositWalletAddress);

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
      const connectedBalance = await getBnbBalance(provider, address);
      setConnectedWalletBalance(connectedBalance);

      // Get deposit wallet balance
      const depositBalance = await getBnbBalance(
        provider,
        depositWalletAddress
      );
      setDepositWalletBalance(depositBalance);
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast({
        title: 'Failed to refresh balances',
        description: 'Could not retrieve wallet balances. Please try again.',
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
      // Leave small amount for gas (0.005 BNB)
      const maxAmount = Math.max(connectedWalletBalance - 0.005, 0).toFixed(4);
      setDepositAmount(maxAmount);
    }
  };

  // Execute BNB transfer
  const handleTransfer = async () => {
    if (!signer || !provider) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue.',
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
        provider,
        signerAddress,
        amount
      );

      if (!sufficient) {
        toast({
          title: 'Insufficient balance',
          description:
            "You don't have enough BNB to complete this transaction.",
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Execute transfer
      const receipt = await transferBnb(signer, depositWalletAddress, amount);

      if (receipt) {
        toast({
          title: 'Transfer successful',
          description: `Successfully transferred ${amount} BNB to the deposit wallet.`,
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
        title: 'Transfer failed',
        description:
          error.message || 'Failed to transfer BNB. Please try again.',
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
          <DialogTitle>Deposit BNB</DialogTitle>
          <DialogDescription>
            Transfer BNB from your connected wallet to the deposit wallet.
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
                      ? `${connectedWalletBalance.toFixed(4)} BNB`
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
                      ? `${depositWalletBalance.toFixed(4)} BNB`
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
              <label htmlFor="bnb-amount" className="text-sm font-medium">
                BNB Amount
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
                id="bnb-amount"
                placeholder="0.0"
                value={depositAmount}
                onChange={handleAmountChange}
                disabled={isLoading || !signer}
              />
              <span className="flex items-center text-sm font-medium px-2">
                BNB
              </span>
            </div>

            {signer &&
              connectedWalletBalance !== null &&
              parseFloat(depositAmount || '0') >
                connectedWalletBalance - 0.005 && (
                <p className="text-xs text-destructive">
                  Insufficient balance. Leave at least 0.005 BNB for gas.
                </p>
              )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
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
                parseFloat(depositAmount) > connectedWalletBalance - 0.005)
            }
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              'Transfer BNB'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
