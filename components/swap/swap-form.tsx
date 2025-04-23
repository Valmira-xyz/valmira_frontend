import { useState } from 'react';

import { ManageWallet } from './manage-wallet';
import { SettingsDialog } from './settings-dialog';
import { TokenInput } from './token-input';
import { ArrowUpDown, Info, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const networks = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bsc', label: 'BSC' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
];

export function SwapForm() {
  const [fromAmount, setFromAmount] = useState('0.0');
  const [toAmount, setToAmount] = useState('0.0');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDT');
  const [fromNetwork, setFromNetwork] = useState('ethereum');
  const [toNetwork, setToNetwork] = useState('ethereum');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [autoRouter, setAutoRouter] = useState(true);
  const [speedupFee, setSpeedupFee] = useState('0.0');

  const handleSwap = () => {
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
          <TokenInput
            type="from"
            amount={fromAmount}
            onAmountChange={setFromAmount}
            token={fromToken}
            onTokenChange={setFromToken}
            balance="1.245 ETH"
            usdValue={
              fromAmount
                ? `$${(parseFloat(fromAmount) * 1850).toFixed(2)}`
                : undefined
            }
            network={fromNetwork}
            onNetworkChange={setFromNetwork}
            networks={networks}
          />

          <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rate</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">1 ETH = 1,850 USDT</span>
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
                <span>Change</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="center">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Swap tool</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This tool enables you to swap tokens between same chain and
                    other chains
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* To Section */}
          <TokenInput
            type="to"
            amount={toAmount}
            onAmountChange={setToAmount}
            token={toToken}
            onTokenChange={setToToken}
            balance="2500 USDT"
            network={toNetwork}
            onNetworkChange={setToNetwork}
            networks={networks}
          />

          <ManageWallet />

          {/* Summary */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <p className="text-sm text-foreground">
              You are going to pay {fromAmount} {fromToken} (USD{' '}
              {(parseFloat(fromAmount) * 1850).toFixed(2)}) from{' '}
              {networks.find((n) => n.value === fromNetwork)?.label} Network and
              you will receive {toAmount} {toToken} (USD{' '}
              {(parseFloat(toAmount) * 1).toFixed(2)}) on{' '}
              {networks.find((n) => n.value === toNetwork)?.label} Network.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Provider</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="bg-muted/50 px-2 rounded-md text-[12px]">
                1 inch
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Minimum received</span>
              <span>1,841.25 USDT</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Price Impact</span>
              <span className="text-green-500">0.05%</span>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center justify-between gap-4">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-[6px] rounded-lg gap-2 w-full">
              <Label>Percentage mode</Label>
              <Switch />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            slippage={slippage}
            setSlippage={setSlippage}
            autoRouter={autoRouter}
            setAutoRouter={setAutoRouter}
            speedupFee={speedupFee}
            setSpeedupFee={setSpeedupFee}
          />

          <Button className="w-full" size="sm">
            Swap {fromToken} to {toToken}
          </Button>

          <div className="flex items-center justify-center text-[12px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Quotes includes a 0.05% Phantom Fee</span>
              <Info className="h-4 w-4" />
            </div>
          </div>

          <div className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Important!</span>
            </div>
            <p className="mt-1">
              Always verify token contracts before swapping. Check for audits
              and community feedback.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
