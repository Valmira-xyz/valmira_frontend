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

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>Track all projects you've referred to Valmira</CardDescription>
            </div>
            <Tabs defaultValue="direct" className="w-fit">
              <TabsList>
                <TabsTrigger value="direct">Direct Referrals (L1)</TabsTrigger>
                <TabsTrigger value="indirect">Indirect Referrals (L2)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Daily fees</TableHead>
                <TableHead>Monthly Fees</TableHead>
                <TableHead>Your %</TableHead>
                <TableHead>Your earnings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralData.map((referral) => (
                <TableRow key={referral.project}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{referral.project}</TableCell>
                  <TableCell>{referral.dateJoined}</TableCell>
                  <TableCell>{referral.dailyFees}</TableCell>
                  <TableCell>{referral.monthlyFees}</TableCell>
                  <TableCell>{referral.percentage}</TableCell>
                  <TableCell>{referral.earnings}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      referral.status === 'Active' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {referral.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              0 of {referralData.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">Previous page</span>
                  Previous
                </Button>
                <div className="flex items-center justify-center text-sm font-medium">
                  Page 1 of 3
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">Next page</span>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 