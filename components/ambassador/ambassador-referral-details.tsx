'use client';

import { useEffect, useState } from 'react';
import { type DateRange } from 'react-day-picker';
// import { FaDiscord } from 'react-icons/fa';
import { BsTwitterX } from 'react-icons/bs';
import { LiaDiscord } from 'react-icons/lia';
import { LuLinkedin } from 'react-icons/lu';
import { SlSocialFacebook } from 'react-icons/sl';
import { useSelector } from 'react-redux';

// import { SiLinkedin } from 'react-icons/si';
import { motion } from 'framer-motion';
import { Copy, DollarSign, MousePointer, Users } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  getDirectReferrals,
  getEnhancedOverview,
  getIndirectReferrals,
} from '@/services/ambassadorService';
import { authService } from '@/services/authService';
import { RootState } from '@/store/store';

// import { directReferrals, indirectReferrals } from '@/lib/mock-data';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface AmbassadorReferralDetailsProps {
  dateRange?: DateRange;
}

// interface ReferralData {
//   project: string;
//   dateJoined: string;
//   dailyFees: string;
//   monthlyFees: string;
//   percentage: string;
//   earnings: string;
//   status: 'Active' | 'Inactive';
// }

// const tabOptions: TableTab[] = [
//   { label: 'Direct Referrals (L1)', value: 'direct' },
//   { label: 'Indirect Referrals (L2)', value: 'indirect' }
// ];

// const metrics = [
//   {
//     title: 'Joined Members',
//     value: 24.0,
//     icon: Users,
//     subtitle: '+8 fromlast month',
//     isCurrency: false,
//   },
//   {
//     title: 'Clicks',
//     value: 123,
//     icon: MousePointer,
//     subtitle: '+12% from yesterday',
//     // subtitleColor: 'text-green-600',
//     isCurrency: false,
//   },
//   {
//     title: 'Direct Referral',
//     value: 342.5,
//     icon: DollarSign,
//     subtitle: '+$120.75 from last month',
//     isCurrency: true,
//   },
// ];

export function AmbassadorReferralDetails({
  dateRange,
}: AmbassadorReferralDetailsProps) {
  // Check authentication state
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const [tab, setTab] = useState<'direct' | 'indirect'>('direct');

  // const dataToShow = tab === 'direct' ? directReferrals : indirectReferrals;
  // const [animatedStats, setAnimatedStats] = useState(
  //   quickStats.map((s) => ({ ...s, value: s.isText ? s.value : 0 }))
  // );
  const {
    data: overviewData,
    // isLoading: isLoadingOverview,
    isError: isOverviewError,
    // error: overviewError
  } = useQuery({
    queryKey: ['ambassadorEnhancedOverview'], // This uses the same key as the overview page, so it will be cached
    queryFn: getEnhancedOverview,
    enabled: isAuthenticated,
  });

  // Query for user profile to get the referral code
  const {
    data: profileData,
    isError: isProfileError,
    // error: profileError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => authService.getProfile(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: isAuthenticated,
  });

  // Query #2: For the Direct Referrals (L1) table
  const {
    data: directReferralsData,
    isLoading: isLoadingDirect,
    isError: isDirectError,
    // error: directError
  } = useQuery({
    queryKey: ['directReferrals'],
    queryFn: getDirectReferrals,
    // This query will only run if the 'direct' tab is active and user is authenticated
    enabled: tab === 'direct' && isAuthenticated,
  });

  // Query #3: For the Indirect Referrals (L2) table
  const {
    data: indirectReferralsData,
    isLoading: isLoadingIndirect,
    isError: isIndirectError,
    // error: indirectError
  } = useQuery({
    queryKey: ['indirectReferrals'],
    queryFn: getIndirectReferrals,
    // This query will only run if the 'indirect' tab is active and user is authenticated
    enabled: tab === 'indirect' && isAuthenticated,
  });

  const [animatedMetrics, setAnimatedMetrics] = useState<any[]>([]);

  // Format date from ISO string to mm/dd/yyyy format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  // Process and format data for display
  const processReferralData = (data: any[]) => {
    if (!data) return [];

    return data.map((item) => ({
      ...item,
      // Format the date for display
      formattedDate: formatDate(item.joinedDate || item.dateJoined),
      // Handle project display - show project name or "N/A" if no project
      displayProject:
        (tab === 'direct' && item.projectName) ||
        (tab === 'indirect' && item.projects) ||
        'N/A',
      // Format percentage - always show 10% for direct, 3% for indirect
      displayPercentage: tab === 'direct' ? '10%' : '3%',
    }));
  };

  const rawData =
    tab === 'direct' ? directReferralsData : indirectReferralsData;
  const dataToShow = processReferralData(rawData);
  const isLoadingData = tab === 'direct' ? isLoadingDirect : isLoadingIndirect;

  const userReferralCode = profileData?.referralCode || 'Loading...';
  const referralLink = `https://valmira.xyz?amb=${userReferralCode}`;

  const handleShare = (platform: 'x' | 'linkedin' | 'facebook') => {
    const text = encodeURIComponent(
      "Boost your token's liquidity and create organic volume with Valmira's on-chain market making bots! Join via my link to get started."
    );
    const url = encodeURIComponent(referralLink);
    let shareUrl = '';

    switch (platform) {
      case 'x':
        shareUrl = `https://x.com/intent/post?url=${url}&text=${text}&hashtags=Crypto,MarketMaking,Valmira`;
        break;
      case 'linkedin':
        // LinkedIn requires the URL to be in the post body, not as a separate param
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}"e=${text}`;
        break;
    }

    // Open the sharing link in a new tab
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      description: 'Referral link copied to clipboard',
    });
  };

  useEffect(() => {
    // This effect now depends on `overviewData`
    const metrics = [
      {
        title: 'Total Referrals',
        value:
          (overviewData?.directReferrals || 0) +
          (overviewData?.indirectReferrals || 0),
        icon: Users,
        subtitle: `${overviewData?.directReferrals || 0} direct, ${overviewData?.indirectReferrals || 0} indirect`,
        isCurrency: false,
      },
      {
        title: 'Total Clicks',
        value: overviewData?.clickTrackingStats?.totalClicks || 0,
        icon: MousePointer,
        subtitle: `${overviewData?.clickTrackingStats?.weeklyClicks || 0} in the last week`,
        isCurrency: false,
      },
      {
        title: 'Lifetime Earnings',
        value: overviewData?.totalEarned || 0,
        icon: DollarSign,
        subtitle: 'From all referral levels',
        isCurrency: true,
      },
    ];

    // Animate from 0 to the target values
    setAnimatedMetrics(metrics.map((m) => ({ ...m, value: 0 })));
    const timer = setTimeout(() => {
      setAnimatedMetrics(metrics);
    }, 100);

    return () => clearTimeout(timer);
  }, [overviewData]); // This effect re-runs when overviewData is fetched

  // useEffect(() => {
  //   // Start with zero
  //   setAnimatedMetrics(metrics.map((m) => ({ ...m, value: 0 })));
  //   // setAnimatedStats(
  //     //   quickStats.map((s) => ({ ...s, value: s.isText ? s.value : 0 }))
  //     // );

  //     // Animate to actual values after a short delay
  //     const timer = setTimeout(() => {
  //       setAnimatedMetrics(metrics);
  //       // setAnimatedStats(quickStats);
  //     }, 100);

  //     return () => clearTimeout(timer);
  //   }, []);

  // const userReferralCode = 'YourCode';
  // const referralLink = `https://valmira.xyz?amb=${userReferralCode}`;

  console.log(dateRange);

  // const metrics = [
  //   {
  //     title: 'Joined Members',
  //     value: (overviewData?.directReferrals || 0 )+ (overviewData?.indirectReferrals || 0),
  //     icon: Users,
  //     subtitle: `${overviewData?.directReferrals || 0} direct, ${overviewData?.indirectReferrals || 0} indirect`,
  //     isCurrency: false,
  //   },
  //   {
  //     title: 'Clicks',
  //     value: overviewData?.clickTrackingStats?.totalClicks || 0,
  //     icon: MousePointer,
  //     subtitle: `${overviewData?.clickTrackingStats?.weeklyClicks || 0} in the last week`,
  //     // subtitleColor: 'text-green-600',
  //     isCurrency: false,
  //   },
  //   {
  //     title: 'Direct Referral',
  //     value: overviewData?.totalEarned || 0,
  //     icon: DollarSign,
  //     subtitle: '+$120.75 from last month',
  //     isCurrency: true,
  //   },
  // ];
  // const [animatedMetrics, setAnimatedMetrics] = useState(
  //   metrics.map((m) => ({ ...m, value: 0 }))
  // );

  // Error display component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-500 mb-4">
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  );

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="text-center p-8 border border-muted rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view your referral details and manage
            your referral network.
          </p>
        </div>
      </div>
    );
  }

  // Check for errors
  if (isOverviewError) {
    return (
      <ErrorDisplay message="Failed to load ambassador overview data. Please try again later." />
    );
  }

  if (isProfileError) {
    return (
      <ErrorDisplay message="Failed to load user profile data. Please try again later." />
    );
  }

  return (
    <motion.div
      className="space-y-4 md:space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {animatedMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-tt">
                  <NumberFlow
                    value={metric.value}
                    locales="en-US"
                    format={
                      metric.isCurrency
                        ? {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        : {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                    }
                  />
                </div>
                <p className={`text-xs ${'text-muted-foreground'}`}>
                  {metric.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-2xl">
            Your Ambassador Link
            <p className="mt-2 text-sm text-muted-foreground font-normal">
              Share this unique link to earn commissions from new projects.
            </p>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('x')}
            >
              <BsTwitterX className="mr-1 h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
            >
              <LuLinkedin className="mr-1 h-4 w-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
            >
              <SlSocialFacebook className="mr-1 h-4 w-4" />
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCopy()}>
              <LiaDiscord className="mr-1 h-4 w-4" />
              Discord
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full">
            <Input
              value={referralLink}
              readOnly
              className="rounded-r-none border-r-0"
            />
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="rounded-l-none !border-l-0 border px-3"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-lg font-tt">Sharing Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Don't spam or use misleading tactics</li>
              <li>Focus on the value Valmira brings to projects</li>
              <li>Respect community rules when sharing in groups</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'direct' | 'indirect')}
        className="w-fit"
      >
        <TabsList className="flex gap-2">
          <TabsTrigger value="direct">Direct Referrals (L1)</TabsTrigger>
          <TabsTrigger value="indirect">Indirect Referrals (L2)</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'direct' && isDirectError ? (
        <ErrorDisplay message="Failed to load direct referrals data. Please try again later." />
      ) : tab === 'indirect' && isIndirectError ? (
        <ErrorDisplay message="Failed to load indirect referrals data. Please try again later." />
      ) : (
        <DataTable
          data={dataToShow || []}
          isLoading={isLoadingData}
          showColumns={[
            { name: 'displayProject', type: 'normal', displayName: 'Project' },
            {
              name: 'formattedDate',
              type: 'normal',
              displayName: 'Date Joined',
            },
            { name: 'dailyBotFee', type: 'price', displayName: 'Daily fees' },
            { name: 'monthlyFee', type: 'price', displayName: 'Monthly fees' },
            {
              name: 'displayPercentage',
              type: 'normal',
              displayName: 'Your Percentage',
            },
            {
              name: 'totalCommissionEarned',
              type: 'price',
              displayName: 'Your Earnings',
            },
            { name: 'status', type: 'status', displayName: 'Status' },
          ]}
          showSearchInput={false}
          showCheckbox={false}
          showPagination={true}
          showDateRange={false}
          showDateButtons={false}
          showDownloadButton={false}
          showTableHeaderInVertical={true}
          title="Your Referrals"
          description="Track all projects you've referred to Valmira"
        />
      )}
    </motion.div>
  );
}
