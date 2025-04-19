'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SwapForm } from '@/components/swap/swap-form';
import { DepositWallet } from '@/components/swap/deposit-wallet';

export default function SwapPage() {
  return (
    <>
      <PageHeader title="Swap" />
      <section className="p-6 space-y-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">Cross-chain Swapping</h1>
          <p className="text-sm text-muted-foreground">
            Seamless user experience to get the funds for your market making and liquidity provisioning
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-y-4 lg:gap-y-6 lg:gap-x-4">
          <Tabs defaultValue="swap" className="col-span-2">
            <TabsList className="bg-muted/50 w-full p-1 h-10">
              <TabsTrigger value="swap" className="w-1/2 h-full data-[state=active]:bg-background">
                Swap
              </TabsTrigger>
              <TabsTrigger value="buy-sell" className="w-1/2 h-full data-[state=active]:bg-background">
                Buy/Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="mt-6">
              <SwapForm />
            </TabsContent>

            <TabsContent value="buy-sell" className="mt-6">
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Coming soon...
              </div>
            </TabsContent>
          </Tabs>

          <div className="col-span-1">
            <DepositWallet />
          </div>
        </div>
      </section>
    </>
  );
} 