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

interface FiatInputProps {
  type: 'from' | 'to';
  amount: string;
  onAmountChange: (value: string) => void;
  usdValue?: string;
  network: string;
  onNetworkChange: (value: string) => void;
  networks: { value: string; label: string }[];
}

export function FiatInput({
  type,
  amount,
  onAmountChange,
  usdValue,
  network,
  onNetworkChange,
  networks,
}: FiatInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-md">
          {type === 'from' ? 'You Pay' : 'You Receive'}
        </Label>
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
        <Button variant="outline" size="default" className="w-[140px]">
          USD
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Select value={network} onValueChange={onNetworkChange}>
          <SelectTrigger className="">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>
                  Payment Method:{' '}
                  {networks.find((n) => n.value === network)?.label || network}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {networks.map((net) => (
              <SelectItem key={net.value} value={net.value}>
                {net.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
