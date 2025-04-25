'use client';

import { type DateRange } from 'react-day-picker';
import { Copy, Facebook, Globe2, Twitter } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { SiLinkedin } from 'react-icons/si';
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { mockAmbassadorEarningsBreakdownData } from '@/lib/mock-data';
import { DataTable, type TableTab } from '@/components/ui/data-table';

interface AmbassadorReferralDetailsProps {
  dateRange?: DateRange;
}

interface ReferralData {
  project: string;
  dateJoined: string;
  dailyFees: string;
  monthlyFees: string;
  percentage: string;
  earnings: string;
  status: 'Active' | 'Inactive';
}

const tabOptions: TableTab[] = [
  { label: 'Direct Referrals (L1)', value: 'direct' },
  { label: 'Indirect Referrals (L2)', value: 'indirect' }
];

export function AmbassadorReferralDetails({ dateRange }: AmbassadorReferralDetailsProps) {
  const { toast } = useToast();
  const referralLink = 'valmira.xyz?amb=YourCode';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      description: 'Referral link copied to clipboard',
    });
  };

  const referralData: ReferralData[] = [
    {
      project: "PEPE",
      dateJoined: "1/15/2024",
      dailyFees: "$45.67",
      monthlyFees: "$1245.78",
      percentage: "10%",
      earnings: "$124.58",
      status: "Active",
    },
    {
      project: "SHIB",
      dateJoined: "2/20/2023",
      dailyFees: "$32.45",
      monthlyFees: "$987.65",
      percentage: "10%",
      earnings: "$98.77",
      status: "Active",
    },
    {
      project: "DOGE",
      dateJoined: "3/10/2023",
      dailyFees: "$28.90",
      monthlyFees: "$867.00",
      percentage: "10%",
      earnings: "$86.70",
      status: "Active",
    },
    {
      project: "MetaToken",
      dateJoined: "1/15/2024",
      dailyFees: "$12.22",
      monthlyFees: "$12.22",
      percentage: "10%",
      earnings: "$123.22",
      status: "Active",
    },
    {
      project: "GameFi",
      dateJoined: "1/15/2024",
      dailyFees: "$12.22",
      monthlyFees: "$12.22",
      percentage: "10%",
      earnings: "$123.22",
      status: "Inactive",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>
            Your Ambassador Link
            <p className="mt-2 text-sm text-muted-foreground font-normal">
              Share this unique link to earn commissions from new projects.
            </p>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Twitter className="mr-1 h-4 w-4" />
              Twitter
            </Button>
            <Button variant="outline" size="sm">
              <SiLinkedin className="mr-1 h-4 w-4" />
              LinkedIn
            </Button>
            <Button variant="outline" size="sm">
              <Facebook className="mr-1 h-4 w-4" />
              Facebook
            </Button>
            <Button variant="outline" size="sm">
              <FaDiscord className="mr-1 h-4 w-4" />
              Discord
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly />
            <Button variant="secondary" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-md">Sharing Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Don't spam or use misleading tactics</li>
              <li>Focus on the value Valmira brings to projects</li>
              <li>Respect community rules when sharing in groups</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={mockAmbassadorEarningsBreakdownData}
        showColumns={[
          { name: 'projectName', type: 'normal', displayName: 'Project' },
          { name: 'dailyBotFee', type: 'price', displayName: 'Daily Fee' },
          { name: 'numberOfBots', type: 'price'},
          { name: 'percentage', type: 'percent', displayName: 'Percentage' },
          { name: 'earnings', type: 'price'},
          { name: 'date', type: 'time', displayName: 'Date' },
        ]}
        filterOption=""
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

    </div>
  );
} 