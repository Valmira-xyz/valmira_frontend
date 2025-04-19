import { TokenSelect } from './token-select';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TokenInputProps {
  type: 'from' | 'to';
  amount: string;
  onAmountChange: (value: string) => void;
  token: string;
  onTokenChange: (value: string) => void;
  balance?: string;
  usdValue?: string;
  network: string;
  onNetworkChange: (value: string) => void;
  networks: { value: string; label: string }[];
}

export function TokenInput({
  type,
  amount,
  onAmountChange,
  token,
  onTokenChange,
  balance,
  usdValue,
  network,
  onNetworkChange,
  networks,
}: TokenInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-md">
          {type === 'from' ? 'You Pay' : 'You Receive'}
        </Label>
        {type === 'from' && (
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Balance: {balance}</Label>
            <Button variant="outline" size="sm">
              MAX
            </Button>
          </div>
        )}
        {type === 'to' && (
          <Label className="text-muted-foreground">Balance: {balance}</Label>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="text-2xl"
          />
          {usdValue && (
            <div className="text-sm text-muted-foreground mt-2">{usdValue}</div>
          )}
        </div>
        <TokenSelect value={token} onChange={onTokenChange} />
      </div>

      <div className="flex items-center justify-between">
        <Select value={network} onValueChange={onNetworkChange}>
          <SelectTrigger className="">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>
                  Network:{' '}
                  {networks.find((n) => n.value === network)?.label || network}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {networks.map((network) => (
              <SelectItem key={network.value} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
