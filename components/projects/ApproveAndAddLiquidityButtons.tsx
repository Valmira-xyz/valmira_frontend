'use client';

import { useEffect, useState } from 'react';

import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  addLiquidity,
  approveTokens,
  CHAIN_CONFIGS,
  enableTrading,
  hasTokenAllowance,
  isTokenTradingEnabled,
  updateSwapTokensAtAmount,
} from '@/services/web3Utils';

interface ApproveAndAddLiquidityButtonsProps {
  tokenAddress: string;
  tokenAmount: string;
  nativeAmount: string;
  signer: ethers.Signer | null;
  onSuccess?: () => void;
  chainName: string;
}

export function ApproveAndAddLiquidityButtons({
  tokenAddress,
  tokenAmount,
  nativeAmount,
  signer,
  onSuccess,
  chainName,
}: ApproveAndAddLiquidityButtonsProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isTradingEnabled, setIsTradingEnabled] = useState(false);
  const [isCheckingTrading, setIsCheckingTrading] = useState(false);
  const [isEnablingTrading, setIsEnablingTrading] = useState(false);
  const [isUpdatingSwapThreshold, setIsUpdatingSwapThreshold] = useState(false);
  const { toast } = useToast();

  const nativeCurrency =
    chainName === 'BSC_MAINNET'
      ? 'BNB'
      : chainName === 'ETH_MAINNET'
        ? 'ETH'
        : chainName === 'SOMNIA_TESTNET'
          ? 'STT'
          : 'SOL';

  // Network-specific router addresses
  const routerAddress = CHAIN_CONFIGS[chainName].routerAddress;

  // Check if token is approved and trading is enabled when component mounts or inputs change
  useEffect(() => {
    const init = async () => {
      await checkTradingStatus();
      await checkApproval();
    };
    init();
  }, [tokenAddress, tokenAmount, signer]);

  // Function to check if trading is enabled
  const checkTradingStatus = async () => {
    if (!signer || !tokenAddress) {
      setIsTradingEnabled(false);
      return;
    }

    try {
      setIsCheckingTrading(true);
      console.log(
        `🔍 Checking trading status for token: ${tokenAddress} on ${chainName}`
      );
      const tradingEnabled = await isTokenTradingEnabled(
        tokenAddress,
        chainName,
        signer
      );
      console.log(
        `📊 Trading status: ${tradingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`
      );
      setIsTradingEnabled(tradingEnabled);

      if (!tradingEnabled) {
        console.warn(
          '⚠️ TRADING IS DISABLED - You must enable trading before adding liquidity!'
        );
        toast({
          title: 'Trading Disabled',
          description: 'Please enable trading on your token first',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error checking trading status:', error);
      setIsTradingEnabled(false);
    } finally {
      setIsCheckingTrading(false);
    }
  };

  // Function to enable trading
  const handleEnableTrading = async () => {
    if (!signer || !tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsEnablingTrading(true);
      console.log(`🚀 Enabling trading for token: ${tokenAddress}`);
      const receipt = await enableTrading(tokenAddress, signer);
      console.log('✅ Trading enabled! Transaction:', receipt.hash);
      setIsTradingEnabled(true);
      toast({
        title: 'Success',
        description: 'Trading enabled successfully! You can now add liquidity.',
      });

      // Recheck approval status after enabling trading
      await checkApproval();
    } catch (error) {
      console.error('❌ Error enabling trading:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to enable trading. Make sure you are the token owner.',
        variant: 'destructive',
      });
    } finally {
      setIsEnablingTrading(false);
    }
  };

  // Function to update swap threshold (to prevent auto-swap issues on first LP)
  const handleUpdateSwapThreshold = async () => {
    if (!signer || !tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdatingSwapThreshold(true);
      console.log(`🔧 Updating swap threshold to 1 billion tokens`);
      // Set to 1 billion to effectively disable auto-swap until liquidity is added
      await updateSwapTokensAtAmount(
        tokenAddress,
        '1000000000',
        signer,
        chainName
      );
      toast({
        title: 'Success',
        description:
          'Swap threshold updated! You can now safely add liquidity.',
      });
    } catch (error) {
      console.error('❌ Error updating swap threshold:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update swap threshold. Your token may not support this function yet.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingSwapThreshold(false);
    }
  };

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
        signer,
        chainName
      );
      setIsApproved(hasAllowance);
    } catch (error) {
      console.error('Error checking token approval:', error);
      setIsApproved(false);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const formatValue = (value: number | string, decimals = 2): string => {
    const decimalValue = new Decimal(value);
    return decimalValue
      .toDecimalPlaces(decimals, Decimal.ROUND_DOWN)
      .toString();
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
      console.log(
        `approveTokens, tokenAddress: ${tokenAddress}, routerAddress: ${routerAddress}, tokenAmount: ${tokenAmount}, signer: ${signer}`
      );
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
      !nativeAmount ||
      parseFloat(tokenAmount) <= 0 ||
      parseFloat(nativeAmount) <= 0
    ) {
      toast({
        title: 'Error',
        description: `Please enter valid token and ${nativeCurrency} amounts and connect your wallet`,
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
      await addLiquidity(
        tokenAddress,
        formatValue(tokenAmount, 9),
        formatValue(nativeAmount, 9),
        signer,
        chainName || 'BSC_MAINNET'
      );
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
    !nativeAmount ||
    parseFloat(tokenAmount) <= 0 ||
    parseFloat(nativeAmount) <= 0;

  return (
    <div className="w-full sm:w-auto flex flex-col gap-2">
      {!isTradingEnabled && (
        <Button
          onClick={handleEnableTrading}
          disabled={!signer || isEnablingTrading || isCheckingTrading}
          variant="default"
          size="sm"
          className="w-full"
        >
          {isEnablingTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enabling Trading...
            </>
          ) : isCheckingTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Enable Trading (Required First)'
          )}
        </Button>
      )}
      {isTradingEnabled && (
        <Button
          onClick={handleUpdateSwapThreshold}
          disabled={!signer || isUpdatingSwapThreshold}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          {isUpdatingSwapThreshold ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Swap Threshold...
            </>
          ) : (
            'Fix Auto-Swap Issue (Optional)'
          )}
        </Button>
      )}
      <div className="grid grid-cols-2 gap-2">
        {!isApproved && (
          <Button
            onClick={handleApprove}
            disabled={
              isDisabled ||
              isApproving ||
              isCheckingApproval ||
              !isTradingEnabled
            }
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
          disabled={
            isDisabled || !isApproved || isAddingLiquidity || !isTradingEnabled
          }
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
    </div>
  );
}
