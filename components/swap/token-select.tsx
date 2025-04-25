import { useState } from 'react';

import { ChevronDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

interface TokenSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function TokenSelect({ value, onChange }: TokenSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[140px] flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <img src={tokens.find((token) => token.symbol === value)?.icon} alt={value} className="w-5 h-5" />
            <span>{value}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="px-2 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredTokens.map((token) => (
            <Button
              key={token.symbol}
              variant="ghost"
              className="w-full justify-start rounded-none h-10"
              onClick={() => {
                onChange(token.symbol);
                setSearch('');
                setOpen(false);
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
  );
}
