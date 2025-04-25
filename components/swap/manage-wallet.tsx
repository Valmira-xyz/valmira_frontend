import { ArrowDown, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const tokens = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '/blockchain-icons/btc.png' },
  { symbol: 'ETH', name: 'Ethereum', icon: '/blockchain-icons/eth.png' },
  { symbol: 'BNB', name: 'Binance', icon: '/blockchain-icons/bnb.png' },
  { symbol: 'SOL', name: 'Solana', icon: '/blockchain-icons/sol.png' },
  { symbol: 'TRON', name: 'Tron', icon: '/blockchain-icons/tron.png' },
  { symbol: 'TON', name: 'Ton', icon: '/blockchain-icons/ton.png' },
  { symbol: 'USDT', name: 'Tether', icon: '/blockchain-icons/usdt.png' },
  { symbol: 'USDC', name: 'USD Coin', icon: '/blockchain-icons/usdc.png' },
];


export function ManageWallet() {
  // Token and network state
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('ETH');
  const [network, setNetwork] = useState('SOL');
  
  // Amount state
  const [fromAmount, setFromAmount] = useState('0.0');
  const [toAmount, setToAmount] = useState('0.0');
  
  // UI state
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkOpen, setNetworkOpen] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  // Filter tokens based on search
  const filteredNetworkTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(networkSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(networkSearch.toLowerCase())
  );

  const filteredFromTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(fromSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(toSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(toSearch.toLowerCase())
  );

  // Handle token swap
  const handleSwap = () => {
    // Swap tokens
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium">Manage Wallet</h3>
        <div className="flex flex-row gap-4 w-full justify-between">
          <div className="flex flex-col gap-2 items-start justify-between w-full">
            <Label>Consolidate</Label>
            <div className="flex flex-col gap-2 w-full">
              <Popover open={networkOpen} onOpenChange={setNetworkOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={tokens.find((token) => token.symbol === network)?.icon} 
                        alt={network} 
                        className="w-5 h-5" 
                      />
                      <span>{network}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" side="bottom" align="start">
                  <div className="px-2 pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tokens"
                        value={networkSearch}
                        onChange={(e) => setNetworkSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredNetworkTokens.map((token) => (
                      <Button
                        key={token.symbol}
                        variant="ghost"
                        className="w-full justify-start rounded-none h-10"
                        onClick={() => {
                          setNetwork(token.symbol);
                          setNetworkSearch('');
                          setNetworkOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <img src={token.icon} alt={token.symbol} className="w-5 h-5" />
                          <div className="flex flex-col items-start">
                            <span>{token.symbol}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-start justify-between w-full">
            <Label>From</Label>
            <div className="flex flex-col gap-2 w-full">
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={tokens.find((token) => token.symbol === fromToken)?.icon} 
                        alt={fromToken} 
                        className="w-5 h-5" 
                      />
                      <span>{fromToken}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" side="bottom" align="start">
                  <div className="px-2 pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tokens"
                        value={fromSearch}
                        onChange={(e) => setFromSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredFromTokens.map((token) => (
                      <Button
                        key={token.symbol}
                        variant="ghost"
                        className="w-full justify-start rounded-none h-10"
                        onClick={() => {
                          setFromToken(token.symbol);
                          setFromSearch('');
                          setFromOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <img src={token.icon} alt={token.symbol} className="w-5 h-5" />
                          <div className="flex flex-col items-start">
                            <span>{token.symbol}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-md"
            onClick={handleSwap}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label>To</Label>
          <div className="flex flex-col gap-2 w-full">
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={tokens.find((token) => token.symbol === toToken)?.icon} 
                      alt={toToken} 
                      className="w-5 h-5" 
                    />
                    <span>{toToken}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" side="bottom" align="start">
                <div className="px-2 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tokens"
                      value={toSearch}
                      onChange={(e) => setToSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredToTokens.map((token) => (
                    <Button
                      key={token.symbol}
                      variant="ghost"
                      className="w-full justify-start rounded-none h-10"
                      onClick={() => {
                        setToToken(token.symbol);
                        setToSearch('');
                        setToOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <img src={token.icon} alt={token.symbol} className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                          <span>{token.symbol}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
