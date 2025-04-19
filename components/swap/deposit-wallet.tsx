import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DepositWallet() {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Deposit Wallet</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">ETH Price:</span>
              <span className="text-sm">$3,245.67</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">SOL Price:</span>
              <span className="text-sm">$142.89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Gas (Ethereum):</span>
              <span className="text-sm">32 Gwei</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
