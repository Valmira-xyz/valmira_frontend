'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useSelector } from 'react-redux';

import { subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Download, Info } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  getPaymentHistory,
  getPaymentSettings,
  type PaymentSettings,
  requestWithdrawal,
  updatePaymentSettings,
} from '@/services/ambassadorService';
import { RootState } from '@/store/store';
// import { mockAmbassadorPaymentSettingsData } from '@/lib/mock-data';

export function AmbassadorPaymentSettings() {
  // Check authentication state
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subWeeks(new Date(), 30),
    to: new Date(),
  });

  const [paymentMethod, setPaymentMethod] = useState('ethereum'); // UI state for the radio group

  // --- FORM DATA STATE ---

  // This state holds the data for the form, which will be synced with the API.

  const [formState, setFormState] = useState<Partial<PaymentSettings>>({
    paymentMethod: 'ethereum',
    paymentCurrency: 'USDC',
  });
  const [network, setNetwork] = useState('ethereum'); // Default to 'ethereum' as it's the first option

  // --- ANIMATION STATE ---

  // State specifically for the animated number display.
  const [animatedAmount, setAnimatedAmount] = useState(0);

  // --- REACT QUERY DATA FETCHING ---

  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
  } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: getPaymentSettings,
    enabled: isAuthenticated,
  });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
  } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: getPaymentHistory,
    enabled: isAuthenticated,
  });

  // --- EFFECTS to synchronize state with fetched data ---

  useEffect(() => {
    // When API data arrives, update our local form state.

    if (settingsData) {
      setFormState(settingsData);
    }
  }, [settingsData]);

  useEffect(() => {
    // When API data arrives, trigger the animation for the balance.

    const targetBalance = settingsData?.availableBalance || 0;

    setAnimatedAmount(0); // Reset to 0 to ensure animation re-triggers

    const timer = setTimeout(() => setAnimatedAmount(targetBalance), 100);

    return () => clearTimeout(timer);
  }, [settingsData?.availableBalance]);

  // useEffect(() => {
  //   // Start with zero
  //   setAnimatedAmount(0);

  //   // Animate to actual value after a short delay
  //   const timer = setTimeout(() => {
  //     setAnimatedAmount(164.0);
  //   }, 100);

  //   return () => clearTimeout(timer);
  // }, []); // Only run on mount

  // --- REACT QUERY MUTATIONS for updating data ---

  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<PaymentSettings>) =>
      updatePaymentSettings(newSettings),

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your payment settings have been saved.',
      });

      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: requestWithdrawal,

    onSuccess: () => {
      toast({
        title: 'Withdrawal Processing',
        description: 'Your request is being processed.',
      });

      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });

      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: `Withdrawal failed: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  // --- EVENT HANDLERS ---

  const handleInputChange = (field: keyof PaymentSettings, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    // Ensure we always save with ethereum payment method and USDC currency
    const updatedFormState = {
      ...formState,
      paymentMethod: 'ethereum',
      paymentCurrency: 'USDC',
      network: network,
    };
    saveSettingsMutation.mutate(updatedFormState);
  };

  const filterOption = useMemo(
    () => ({
      key: { label: 'Status', value: 'status' },
      options: ['All', 'Completed', 'Pending', 'Failed'],
    }),
    []
  );

  if (isLoadingSettings) {
    return <div>Loading...</div>; // Replace with a skeleton loader component if desired
  }

  const availableBalance = settingsData?.availableBalance || 0;

  // Error display component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-500 mb-4">
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  );

  // Check for errors
  // Handle unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="text-center p-8 border border-muted rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view your payment settings and
            history.
          </p>
        </div>
      </div>
    );
  }

  if (isSettingsError) {
    return (
      <ErrorDisplay message="Failed to load payment settings. Please try again later." />
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="w-full md:col-span-3">
          <CardHeader className=" !pb-0">
            <CardTitle className="font-semibold">Payment Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Read and write directly to databases and stores from your
              projects.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="font-tt font-semibold">Payment method</Label>
              <RadioGroup
                defaultValue="ethereum"
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem
                    value="stablecoins"
                    id="stablecoins"
                    disabled
                  />
                  <Label htmlFor="stablecoins" className="cursor-not-allowed">
                    Stablecoins (USDC, USDT, DAI)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ethereum" id="ethereum" />
                  <Label htmlFor="ethereum">Native currency(ETH/BNB)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="font-semibold font-tt">Network</Label>
              <Select
                value={network}
                onValueChange={(value) => setNetwork(value)}
              >
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
              <Label className="font-tt font-semibold">
                Preferred stable coin
              </Label>
              <Select value="USDC" disabled>
                <SelectTrigger className="cursor-not-allowed opacity-50">
                  <SelectValue placeholder="USDC" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>

                  <SelectItem value="USDT">USDT</SelectItem>

                  <SelectItem value="ETH">ETH</SelectItem>

                  <SelectItem value="BNB">BNB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="font-semibold font-tt">Payment Address</Label>
              <Input
                placeholder="Enter your payment address (e.g., 0x...)"
                value={formState.paymentAddress || ''}
                onChange={(e) =>
                  handleInputChange('paymentAddress', e.target.value)
                }
              />
            </div>

            <div className="space-y-4 bg-muted p-4 rounded-md">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Automatic Withdrawals</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically withdraw earnings when they reach the
                    threshold
                  </p>
                </div>
                <Switch
                  id="auto-withdraw"
                  checked={!!formState.autoWithdrawEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange('autoWithdrawEnabled', checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-tt font-semibold">
                Withdrawal Threshold ($)
              </Label>
              <Input
                type="number"
                placeholder="50"
                value={formState.minAutoWithdraw || ''}
                onChange={(e) =>
                  handleInputChange(
                    'minAutoWithdraw',
                    parseFloat(e.target.value) || 0
                  )
                }
                disabled={!formState.autoWithdrawEnabled}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setFormState(settingsData || {})}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSaveChanges}
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full col-span-2">
          <CardHeader>
            <CardTitle>Pending Earnings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your current ambassador earnings available for withdrawal
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-8 text-center">
              <h3 className="text-3xl font-bold font-tt">
                <NumberFlow
                  value={animatedAmount}
                  locales="en-US"
                  format={{
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Available for withdrawal
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Next automatic withdrawal:</span>
                </div>
                <span className="text-sm font-bold font-tt">
                  {formState.autoWithdrawEnabled
                    ? `When balance reaches $${formState.minAutoWithdraw || 0}`
                    : 'Disabled'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ambassador Rank</span>
                </div>
                <span className="text-sm font-bold font-tt">
                  {/* This part can be driven by API data later if needed */}
                  {new Date().toLocaleDateString()} (
                  <NumberFlow
                    value={animatedAmount}
                    locales="en-US"
                    format={{
                      style: 'currency',

                      currency: 'USD',

                      minimumFractionDigits: 2,

                      maximumFractionDigits: 2,
                    }}
                  />
                  )
                </span>
              </div>

              <div className="bg-red-50 text-red-600 rounded-md p-3 flex items-center gap-2 text-sm">
                <Info className="!h-4 !w-4 text-red-400" />
                <span>
                  Withdrawals are processed within 24 hours. Gas fees may apply
                  depending on network conditions.
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => withdrawalMutation.mutate()}
              disabled={withdrawalMutation.isPending || availableBalance <= 0}
            >
              {withdrawalMutation.isPending ? 'Processing...' : `Withdraw Now`}{' '}
              (
              <NumberFlow
                value={animatedAmount}
                locales="en-US"
                format={{
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
              )
            </Button>
          </CardContent>
        </Card>
      </div>

      {isHistoryError ? (
        <ErrorDisplay message="Failed to load payment history. Please try again later." />
      ) : (
        <DataTable
          data={historyData || []}
          isLoading={isLoadingHistory}
          filterOption={filterOption}
          showColumns={[
            { name: 'date', type: 'time', displayName: 'Date' },
            { name: 'amount', type: 'price', displayName: 'Amount' },
            { name: 'to', type: 'normal', displayName: 'To' },
            { name: 'status', type: 'status', displayName: 'Status' },
            { name: 'txHash', type: 'normal', displayName: 'Tx Hash' },
          ]}
          dateFieldName="date"
          showSearchInput={false}
          showTitleSideByside={true}
          showCheckbox={false}
          showPagination={true}
          showDateRange={true}
          showDateButtons={true}
          showDownloadButton={false}
          showTableHeaderInVertical={false}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          title="Recent Payments"
          description="Record of all your ambassador payouts"
        />
      )}

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
              <h3 className="font-bold mb-2 font-tt">Commission Structure</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>
                  Level 1 (Direct Referrals): 10% of all fees generated by
                  projects that sign up using your unique link.
                </li>
                <li>
                  Level 2 (Indirect Referrals): 3% of all fees generated by
                  projects that your direct referrals bring to Valmira.
                </li>
              </ul>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2 font-tt">Payment Terms</h3>
              <p className="text-sm text-muted-foreground">
                Payments are processed daily based on your settings. Minimum
                withdrawal amount is $10. Gas fees may be deducted from your
                earnings for on-chain transactions.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2 font-tt">Ethical Guidelines</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>
                  Do not spam or use misleading tactics to promote your
                  ambassador link
                </li>
                <li>
                  Do not impersonate Valmira staff or make false claims about
                  the platform
                </li>
                <li>
                  Respect community rules when sharing in groups or forums
                </li>
                <li>Focus on the value Valmira brings to projects</li>
              </ul>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2 font-tt">Program Changes</h3>
              <p className="text-sm text-muted-foreground">
                Valmira reserves the right to modify the ambassador program
                terms, including commission rates and payment methods, with
                reasonable notice to participants.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
