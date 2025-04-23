'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { subDays } from 'date-fns';

import { AmbassadorOverview } from '@/components/ambassador/ambassador-overview';
import { AmbassadorReferralDetails } from '@/components/ambassador/ambassador-referral-details';
import { AmbassadorEarningBreakdown } from '@/components/ambassador/ambassador-earning-breakdown';
import { AmbassadorPaymentSettings } from '@/components/ambassador/ambassador-payment-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AmbassadorPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="">
      <div className="p-4 md:p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 md:space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-1 sm:gap-4 items-center justify-between">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger className='text-[12px] md:text-sm px-2 sm:px-3' value="overview">Overview</TabsTrigger>
              <TabsTrigger className='text-[12px] md:text-sm px-2 sm:px-3' value="referral-details">Referral Details</TabsTrigger>
              <TabsTrigger className='text-[12px] md:text-sm px-2 sm:px-3' value="earning-breakdown">Earning Breakdown</TabsTrigger>
              <TabsTrigger className='text-[12px] md:text-sm px-2 sm:px-3' value="payment-settings">Payment Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <AmbassadorOverview />
          </TabsContent>

          <TabsContent value="referral-details" className="space-y-4">
            <AmbassadorReferralDetails dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="earning-breakdown" className="space-y-4">
            <AmbassadorEarningBreakdown dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="payment-settings" className="space-y-4">
            <AmbassadorPaymentSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 