import { ArrowDown } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ManageWallet() {
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium">Manage Wallet</h3>
        <div className="flex flex-row gap-4 w-full justify-between">
          <div className="flex flex-col gap-2 items-start justify-between w-full">
            <Label>Consolidate</Label>
            <Select defaultValue="bnb">
              <SelectTrigger className="">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <img src="/eth-logo.png" alt="BNB" className="w-5 h-5" />
                    <span>BNB</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="bnb">BNB</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 items-start justify-between w-full">
            <Label>From</Label>
            <Select defaultValue="bnb">
              <SelectTrigger className="">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <img src="/eth-logo.png" alt="BNB" className="w-5 h-5" />
                    <span>BNB</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="bnb">BNB</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center border rounded-lg p-2">
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label>To</Label>
          <Select defaultValue="bnb">
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <img src="/eth-logo.png" alt="BNB" className="w-5 h-5" />
                  <span>BNB</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eth">ETH</SelectItem>
              <SelectItem value="bnb">BNB</SelectItem>
              <SelectItem value="usdt">USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
