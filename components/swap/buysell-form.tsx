import { useState } from 'react';

import { FiatInput } from './fiat-input';
import { TokenInput } from './token-input';
import { ArrowUpDown, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const cryptoNetworks = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bsc', label: 'BSC' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
];

const fiatNetworks = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'google_pay', label: 'Google Pay' },
];

export function BuySellForm() {
  const [fromAmount, setFromAmount] = useState('0.0');
  const [toAmount, setToAmount] = useState('0.0');
  const [fromToken, setFromToken] = useState('USD');
  const [toToken, setToToken] = useState('ETH');
  const [fromNetwork, setFromNetwork] = useState('credit_card');
  const [toNetwork, setToNetwork] = useState('ethereum');
  const [isBuying, setIsBuying] = useState(true);

  const handleSwap = () => {
    // Toggle between buying and selling
    setIsBuying(!isBuying);

    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);

    // Swap tokens
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    // Swap networks
    const tempNetwork = fromNetwork;
    setFromNetwork(toNetwork);
    setToNetwork(tempNetwork);
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* From Section */}
          {isBuying ? (
            <FiatInput
              type="from"
              amount={fromAmount}
              onAmountChange={setFromAmount}
              usdValue={fromAmount ? `$${fromAmount}` : undefined}
              network={fromNetwork}
              onNetworkChange={setFromNetwork}
              networks={fiatNetworks}
            />
          ) : (
            <TokenInput
              type="from"
              amount={fromAmount}
              onAmountChange={setFromAmount}
              usdValue={
                fromAmount
                  ? `$${(parseFloat(fromAmount) * 1850).toFixed(2)}`
                  : undefined
              }
              token={fromToken}
              onTokenChange={setFromToken}
              network={fromNetwork}
              onNetworkChange={setFromNetwork}
              networks={cryptoNetworks}
            />
          )}

          <div className="flex items-center justify-between gap-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rate</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">  
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="center">
                  <div className="flex items-center gap-4 mb-1">
                    <Info className="h-6 w-6 self-start" />
                    <div className='flex flex-col'>
                      <span className="font-medium">Rate</span>
                      <span className="text-xs text-muted-foreground">
                        The current exchange rate between the two selected tokens.
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm">1 ETH = 1,850 USD</span>
          </div>

          {/* Change Button */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 px-3"
                onClick={handleSwap}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>{isBuying ? 'Switch to Sell' : 'Switch to Buy'}</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="center">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-5 w-5 self-start" />
                    <div className='flex flex-col'>
                      <span className="font-medium">Buy/Sell tool</span>
                      <span className="text-xs text-muted-foreground">
                      {isBuying
                      ? 'This tool enables you to buy crypto with fiat currency'
                      : 'This tool enables you to sell crypto for fiat currency'}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* To Section */}
          {isBuying ? (
            <TokenInput
              type="to"
              amount={toAmount}
              onAmountChange={setToAmount}
              token={toToken}
              onTokenChange={setToToken}
              balance="1.245 ETH"
              network={toNetwork}
              onNetworkChange={setToNetwork}
              networks={cryptoNetworks}
            />
          ) : (
            <FiatInput
              type="to"
              amount={toAmount}
              onAmountChange={setToAmount}
              usdValue={toAmount ? `$${toAmount}` : undefined}
              network={toNetwork}
              onNetworkChange={setToNetwork}
              networks={fiatNetworks}
            />
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isBuying ? (
                  <span>Provider Fee</span>
                ) : (
                  <span>Withdrawal Fee</span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="w-[280px] p-3" align="center">
                    <div className="flex items-center gap-4 mb-1">
                      <Info className="h-6 w-6 self-start" />
                      <div className='flex flex-col'>
                        <span className="font-medium">Provider Fee</span>
                        <span className="text-xs text-muted-foreground">
                          The fee charged by the provider for the transaction.
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="bg-muted/50 px-2 rounded-md text-[12px]">
                2.5%
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Summary</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="center">
                  <div className="flex items-center gap-4 mb-1">
                    <Info className="h-6 w-6 self-start" />
                    <div className='flex flex-col'>
                      <span className="font-medium">Summary</span>
                      <span className="text-xs text-muted-foreground">
                        An overview of your swap details, including amounts, rates and fees.
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-foreground">
              {isBuying
                ? `You are going to pay ${fromAmount} ${fromToken} from ${fiatNetworks.find((n) => n.value === fromNetwork)?.label} and you will receive ${toAmount} ${toToken} on ${cryptoNetworks.find((n) => n.value === toNetwork)?.label}.`
                : `You are going to sell ${fromAmount} ${fromToken} from ${cryptoNetworks.find((n) => n.value === fromNetwork)?.label} and you will receive ${toAmount} ${toToken} on ${fiatNetworks.find((n) => n.value === toNetwork)?.label}.`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isBuying
                ? `Purchases may take up to 5 minutes to process depending on the payment method.`
                : `Withdrawals may take 1-3 business days to appear in your bank account.`}
            </p>
          </div>

          <Button className="w-full" size="sm">
            {isBuying ? `Buy ${toToken}` : `Sell ${fromToken}`}
          </Button>

          <div className="flex items-center justify-center text-[12px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Quotes includes a 0.05% Phantom Fee</span>
              {/* <Info className="h-4 w-4" /> */}
            </div>
          </div>

          <div className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                    <span>Important!</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="center">
                  <div className="flex items-center gap-4 mb-1">
                    <Info className="h-8 w-8 self-start" />
                    <div className='flex flex-col'>
                      <span className="font-medium">Important!</span>
                      <span className="text-xs text-muted-foreground">
                        Always verify the crypto you're buying. Check for audits and community feedback.
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="mt-1">
              {isBuying
                ? "Always verify the crypto you're buying. Check for audits and community feedback."
                : 'Always verify token contracts before selling. Check for audits and community feedback.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
