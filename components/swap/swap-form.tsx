import { useState } from 'react';
import { ArrowUpDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TokenSelect } from './token-select';
import { ManageWallet } from './manage-wallet';
import { SettingsDialog } from './settings-dialog';

export function SwapForm() {
  const [fromAmount, setFromAmount] = useState('0.0');
  const [toAmount, setToAmount] = useState('0.0');
  const [fromToken, setFromToken] = useState('BNB');
  const [toToken, setToToken] = useState('USDT');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [autoRouter, setAutoRouter] = useState(true);
  const [speedupFee, setSpeedupFee] = useState('0.0');

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* From Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-md">You Pay</Label>
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">Balance: 1.245 ETH</Label>
                <Button variant="outline" size="sm">MAX</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input 
                  type="number" 
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="text-2xl"
                />
                <div className="text-sm text-muted-foreground mt-2">$1.3K</div>
              </div>
              <TokenSelect value={fromToken} onChange={setFromToken} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Select defaultValue="ethereum">
              <SelectTrigger className="">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>Network: Ethereum</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rate</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">1 ETH = 1,850 USDT</span>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2 px-3">
                <ArrowUpDown className="h-4 w-4" />
                <span>Swap</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] p-3" align="start">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Swap tool</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    this tool enables you to swap tokens between same chain and other chains
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* To Section */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-md">You Receive</Label>
              <Label className="text-muted-foreground">Balance: 2500 USDT</Label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input 
                  type="number" 
                  placeholder="0.0"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="text-2xl"
                />
              </div>
              <TokenSelect value={toToken} onChange={setToToken} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Select defaultValue="ethereum">
              <SelectTrigger className="">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>Network: Ethereum</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ManageWallet />

          {/* Summary */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <p className="text-sm text-foreground">
              You are going to pay 20 ETH (USD 20000) from Ethereum Network and you will receive 20000
              HDUS (USD 199999) on Binance Smart Chain.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Provider</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="bg-muted/50 px-2 rounded-md text-[12px]">1 inch</span>
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
              <Info className="h-4 w-4 mr-2" />
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

          <Button className="w-full" size="sm">Swap</Button>

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
            <p className="mt-1">Always verify token contracts before swapping. Check for audits and community feedback.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 