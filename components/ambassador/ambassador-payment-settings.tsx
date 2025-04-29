'use client';

import { useState, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import NumberFlow from '@number-flow/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/ui/data-table';
import { mockAmbassadorPaymentSettingsData } from '@/lib/mock-data';
import { motion } from 'framer-motion';

export function AmbassadorPaymentSettings() {
  const [paymentMethod, setPaymentMethod] = useState('stablecoins');
  const [animatedAmount, setAnimatedAmount] = useState(0);
  
  useEffect(() => {
    // Start with zero
    setAnimatedAmount(0);
    
    // Animate to actual value after a short delay
    const timer = setTimeout(() => {
      setAnimatedAmount(164.00);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  const filterOption = useMemo(() => (
    { 
      key: { label: "Status", value: "status"}, 
      options: ["All", "Completed", "Pending", "Failed"] 
    }), []);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Read and write directly to databases and stores from your projects.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Payment method</Label>
              <RadioGroup 
                defaultValue="stablecoins" 
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stablecoins" id="stablecoins" />
                  <Label htmlFor="stablecoins">Stablecoins (USDC, USDT, DAI)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ethereum" id="ethereum" />
                  <Label htmlFor="ethereum">Ethereum</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Network</Label>
              <Select defaultValue="ethereum">
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Preferred stable coin</Label>
              <Input placeholder="Enter your preferred stable coin" />
            </div>

            <div className="space-y-4">
              <Label>Payment Address</Label>
              <Input placeholder="Enter your payment address" />
            </div>

            <div className="space-y-4 bg-muted p-4 rounded-md">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Automatic Withdrawals</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically withdraw earnings when they reach the threshold
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Withdrawal Threshold ($)</Label>
              <Input type="number" placeholder="50" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Settings</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending Earnings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your current ambassador earnings available for withdrawal
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-8 text-center">
              <h3 className="text-3xl font-bold">
                <NumberFlow 
                  value={animatedAmount}
                  format={{
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }}
                />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Next automatic withdrawal:</span>
                <span className="text-sm font-medium">When balance reaches $50</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ambassador Rank</span>
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString()} (
                  <NumberFlow 
                    value={animatedAmount}
                    format={{
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }}
                  />
                  )
                </span>
              </div>
              <p className="text-sm text-red-600">
                Withdrawals are processed within 24 hours. Gas fees may apply depending on network conditions.
              </p>
            </div>

            <Button className="w-full">Withdraw Now (
              <NumberFlow 
                value={animatedAmount}
                format={{
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
              />)</Button>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={mockAmbassadorPaymentSettingsData}
        filterOption={ filterOption }
        showSearchInput={false}
        showCheckbox={false}
        showPagination={true}
        showDateRange={true}
        showDateButtons={true}
        showDownloadButton={false}
        showTableHeaderInVertical={false}
        title="Recent Payments"
        description="Record of all your ambassador payouts"
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Important information about the ambassador program
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Commission Structure</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Level 1 (Direct Referrals): 10% of all fees generated by projects that sign up using your unique link.</li>
                <li>Level 2 (Indirect Referrals): 3% of all fees generated by projects that your direct referrals bring to Valmira.</li>
              </ul>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Payment Terms</h3>
              <p className="text-sm text-muted-foreground">
                Payments are processed daily based on your settings. Minimum withdrawal amount is $10. Gas fees may be deducted from your earnings for on-chain transactions.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Ethical Guidelines</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Do not spam or use misleading tactics to promote your ambassador link</li>
                <li>Do not impersonate Valmira staff or make false claims about the platform</li>
                <li>Respect community rules when sharing in groups or forums</li>
                <li>Focus on the value Valmira brings to projects</li>
              </ul>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Program Changes</h3>
              <p className="text-sm text-muted-foreground">
                Valmira reserves the right to modify the ambassador program terms, including commission rates and payment methods, with reasonable notice to participants.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 