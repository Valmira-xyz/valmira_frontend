'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { subDays } from 'date-fns';
import { Download } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { AmbassadorOverview } from '@/components/ambassador/ambassador-overview';
import { AmbassadorReferralDetails } from '@/components/ambassador/ambassador-referral-details';
import { AmbassadorEarningBreakdown } from '@/components/ambassador/ambassador-earning-breakdown';
import { AmbassadorPaymentSettings } from '@/components/ambassador/ambassador-payment-settings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function AmbassadorPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: 'Exporting data',
      description: 'Your ambassador data is being exported as CSV.',
    });
  };

  return (
    <div className="">
      <PageHeader title="Ambassador Program">
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 md:space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referral-details">Referral Details</TabsTrigger>
              <TabsTrigger value="earning-breakdown">Earning Breakdown</TabsTrigger>
              <TabsTrigger value="payment-settings">Payment Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <AmbassadorOverview dateRange={dateRange} />
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