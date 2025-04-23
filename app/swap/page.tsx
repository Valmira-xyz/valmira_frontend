'use client';

import { PageHeader } from '@/components/layout/page-header';
import { BuySellForm } from '@/components/swap/buysell-form';
import { DepositWallet } from '@/components/swap/deposit-wallet';
import { SwapForm } from '@/components/swap/swap-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SwapPage() {
  return (
    <div className="p-4 md:p-6 space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Cross-chain Swapping</h1>
        <p className="text-sm text-muted-foreground">
          Seamless user experience to get the funds for your market making and
          liquidity provisioning
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-y-4 lg:gap-y-6 lg:gap-x-4">
        <Tabs defaultValue="swap" className="col-span-2">
          <TabsList className="bg-muted w-full p-1 h-10">
            <TabsTrigger
              value="swap"
              className="w-1/2 h-full data-[state=active]:bg-background"
            >
              Swap
            </TabsTrigger>
            <TabsTrigger
              value="buy-sell"
              className="w-1/2 h-full data-[state=active]:bg-background"
            >
              Buy/Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="mt-6">
            <SwapForm />
          </TabsContent>

          <TabsContent value="buy-sell" className="mt-6">
            <BuySellForm />
          </TabsContent>
        </Tabs>

        <div className="col-span-1">
          <DepositWallet />
        </div>
      </div>
    </div>
  );
}
