'use client';

import { useEffect, useState } from 'react';

import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  addLiquidity,
  approveTokens,
  hasTokenAllowance,
} from '@/services/web3Utils';

interface ApproveAndAddLiquidityButtonsProps {
  tokenAddress: string;
  tokenAmount: string;
  bnbAmount: string;
  signer: ethers.Signer | null;
  onSuccess?: () => void;
}

export function ApproveAndAddLiquidityButtons({
  tokenAddress,
  tokenAmount,
  bnbAmount,
  signer,
  onSuccess,
}: ApproveAndAddLiquidityButtonsProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const { toast } = useToast();

  // Network-specific router addresses
  const routerAddress =
    process.env.NEXT_PUBLIC_NETWORK === 'testnet'
      ? '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' // PancakeSwap Router on BSC Testnet
      : '0x10ED43C718714eb63d5aA57B78B54704E256024E'; // PancakeSwap Router on BSC Mainnet

  // Check if token is approved when component mounts or inputs change
  useEffect(() => {
    checkApproval();
  }, [tokenAddress, tokenAmount, signer]);

  // Function to check if token is approved
  const checkApproval = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      parseFloat(tokenAmount) <= 0
    ) {
      setIsApproved(false);
      return;
    }

    try {
      setIsCheckingApproval(true);
      const signerAddress = await signer.getAddress();
      const hasAllowance = await hasTokenAllowance(
        tokenAddress,
        signerAddress,
        routerAddress,
        tokenAmount,
        signer
      );
      setIsApproved(hasAllowance);
    } catch (error) {
      console.error('Error checking token approval:', error);
      setIsApproved(false);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Function to approve tokens
  const handleApprove = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      parseFloat(tokenAmount) <= 0
    ) {
      toast({
        title: 'Error',
        description: 'Please enter valid token amount and connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsApproving(true);
      await approveTokens(tokenAddress, routerAddress, tokenAmount, signer);
      setIsApproved(true);
      toast({
        title: 'Success',
        description: 'Token approval successful',
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to approve tokens',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Function to add liquidity
  const handleAddLiquidity = async () => {
    if (
      !signer ||
      !tokenAddress ||
      !tokenAmount ||
      !bnbAmount ||
      parseFloat(tokenAmount) <= 0 ||
      parseFloat(bnbAmount) <= 0
    ) {
      toast({
        title: 'Error',
        description:
          'Please enter valid token and BNB amounts and connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!isApproved) {
      toast({
        title: 'Error',
        description: 'Please approve tokens first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAddingLiquidity(true);
      await addLiquidity(tokenAddress, tokenAmount, bnbAmount, signer);
      toast({
        title: 'Success',
        description: 'Liquidity added successfully',
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  // If no signer or invalid inputs, disable buttons
  const isDisabled =
    !signer ||
    !tokenAddress ||
    !tokenAmount ||
    !bnbAmount ||
    parseFloat(tokenAmount) <= 0 ||
    parseFloat(bnbAmount) <= 0;

  return (
    <div className="w-full sm:w-auto grid grid-cols-2 gap-2">
      {!isApproved && (
        <Button
          onClick={handleApprove}
          disabled={isDisabled || isApproving || isCheckingApproval}
          variant="outline"
          size="sm"
        >
          {isApproving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving...
            </>
          ) : isCheckingApproval ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Approve Tokens'
          )}
        </Button>
      )}
      <Button
        onClick={handleAddLiquidity}
        disabled={isDisabled || !isApproved || isAddingLiquidity}
        size="sm"
      >
        {isAddingLiquidity ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Liquidity...
          </>
        ) : (
          'Add Liquidity'
        )}
      </Button>
    </div>
  );
}
