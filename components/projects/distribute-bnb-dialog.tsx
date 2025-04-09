import React from 'react';

import { WalletInfo } from './simulate-and-execute-dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DistributeBnbDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletInfo[];
  distributeAmount: number;
  setDistributeAmount: (amount: number) => void;
  onConfirm: () => void;
}

export function DistributeBnbDialog({
  open,
  onOpenChange,
  wallets,
  distributeAmount,
  setDistributeAmount,
  onConfirm,
}: DistributeBnbDialogProps) {
  // Find the deposit wallet (botmain role)
  const depositWallet = wallets.find(
    (wallet: WalletInfo) => wallet.role === 'botmain'
  );
  const depositWalletBalance = depositWallet?.bnbBalance || 0;

  // Get selected wallets (all non-botmain wallets that are either:
  // 1. All non-botmain wallets if none are specifically selected for multi operations
  // 2. Only those selected for multi operations if at least one is selected)
  const selectedForMulti = wallets.filter(
    (wallet: WalletInfo) =>
      wallet.role !== 'botmain' && wallet.isSelectedForMutilSell
  );

  const snipingWallets =
    selectedForMulti.length > 0
      ? selectedForMulti
      : wallets.filter((wallet: WalletInfo) => wallet.role !== 'botmain');

  const walletCount = selectedForMulti.length;
  const amountPerWallet = walletCount > 0 ? distributeAmount / walletCount : 0;

  // Quick percentage button handler
  const handlePercentage = (percentage: number) => {
    const amount = depositWalletBalance * (percentage / 100);
    setDistributeAmount(parseFloat(amount.toFixed(6)));
  };

  // Format wallet address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Distribute Extra BNB</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the amount of BNB to distribute evenly among {walletCount}{' '}
            selected sniping wallet{walletCount !== 1 ? 's' : ''}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-4">
          {/* Deposit wallet info */}
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Deposit Wallet:</span>
              <span className="font-medium">
                {formatAddress(depositWallet?.publicKey || '')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available BNB:</span>
              <span className="font-medium">
                {depositWalletBalance.toFixed(6)}
              </span>
            </div>
          </div>

          {/* BNB Amount input with percentage buttons */}
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="distribute-amount"
                className="text-sm font-medium leading-none"
              >
                BNB Amount
              </label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handlePercentage(10)}
                >
                  10%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handlePercentage(20)}
                >
                  20%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handlePercentage(50)}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handlePercentage(100)}
                >
                  Max
                </Button>
              </div>
            </div>
            <Input
              id="distribute-amount"
              type="number"
              step="0.001"
              min="0"
              max={depositWalletBalance}
              placeholder="0.000"
              value={distributeAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                // Cap at deposit wallet balance
                setDistributeAmount(Math.min(value, depositWalletBalance));
              }}
              className={
                distributeAmount > depositWalletBalance ? 'border-red-500' : ''
              }
            />
            {distributeAmount > depositWalletBalance && (
              <p className="text-xs text-red-500">
                Amount exceeds available balance
              </p>
            )}
          </div>

          {/* Distribution details */}
          <div className="grid gap-2 bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected wallets:</span>
              <span className="font-medium">{walletCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">BNB per wallet:</span>
              <span className="font-medium">{amountPerWallet.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Total to distribute:
              </span>
              <span className="font-medium">{distributeAmount.toFixed(6)}</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={
              distributeAmount <= 0 ||
              walletCount === 0 ||
              distributeAmount > depositWalletBalance
            }
          >
            Distribute
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
