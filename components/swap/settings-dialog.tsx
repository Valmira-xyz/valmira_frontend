import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slippage: string;
  setSlippage: (value: string) => void;
  autoRouter: boolean;
  setAutoRouter: (value: boolean) => void;
  speedupFee: string;
  setSpeedupFee: (value: string) => void;
}

const slippageOptions = [
  { value: '0.1', label: '0.1%' },
  { value: '0.5', label: '0.5%' },
  { value: '1', label: '1%' },
  { value: '3', label: '3%' },
];

export function SettingsDialog({
  open,
  onOpenChange,
  slippage,
  setSlippage,
  autoRouter,
  setAutoRouter,
  speedupFee,
  setSpeedupFee,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[400px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Swap Settings</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your swap parameters for optimal trading.
          </p>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-between">
              <div className='flex items-center gap-2'>
                <Label>Slippage Tolerance</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="w-[280px] p-3" align='start'>
                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className='text-sm text-muted-foreground'>{slippage}%</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {slippageOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={slippage === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSlippage(option.value)}
                  className="px-3 py-1 h-8"
                >
                  {option.label}
                </Button>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-24 md:w-24 h-8"
                  placeholder='Custom'
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Auto Router</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Automatically find the best route for your swap
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch 
                checked={autoRouter}
                onCheckedChange={setAutoRouter}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically find the best route for your swap
            </p>
          </div>

          <div className="space-y-2">
            <Label>Speedup fee</Label>
            <Input
              type="number"
              value={speedupFee}
              onChange={(e) => setSpeedupFee(e.target.value)}
              className="h-8"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 