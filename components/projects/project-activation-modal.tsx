'use client';

import React, { useEffect, useState } from 'react';

import {
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  type ActivationFeeData,
  activationService,
} from '@/services/activationService';

interface ProjectActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onActivationSuccess: () => void;
}

interface EnhancedActivationFeeData extends ActivationFeeData {
  nativeAmount: number;
  nativeCurrency: string;
  nativePrice: number;
}

export const ProjectActivationModal: React.FC<ProjectActivationModalProps> = ({
  isOpen,
  onClose,
  project,
  onActivationSuccess,
}) => {
  const { toast } = useToast();
  const [feeData, setFeeData] = useState<EnhancedActivationFeeData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    'fee-display' | 'verifying' | 'success' | 'error'
  >('fee-display');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      fetchActivationFee();
    }
  }, [isOpen, project]);

  const fetchActivationFee = async () => {
    if (!project) return;

    setLoading(true);
    try {
      // Get activation fee data from backend
      const feeInfo = await activationService.getActivationFee(project._id);
      console.log('project.chainName:', project.chainName);

      // Get current native currency price
      const nativeCurrency = activationService.getNativeCurrencySymbol(
        project.chainName
      );
      console.log('nativeCurrency:', nativeCurrency);
      const priceInfo = await activationService.getNativeCurrencyPrice(
        nativeCurrency as 'BNB' | 'ETH' | 'STT'
      );
      console.log('priceInfo.price:', priceInfo.price);
      const nativeAmount = activationService.calculateNativeAmount(
        feeInfo.setupFeeUSD,
        priceInfo.price
      );

      setFeeData({
        ...feeInfo,
        nativeAmount,
        nativeCurrency,
        nativePrice: priceInfo.price,
      });
    } catch (error) {
      console.error('Error fetching activation fee:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch activation fee information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address copied',
      description: 'Fee wallet address has been copied to clipboard',
    });
  };

  const handleVerifyPayment = async () => {
    if (!project || !feeData) return;

    setStep('verifying');

    try {
      const result = await activationService.verifyActivation(project._id);

      if (result.success) {
        setStep('success');
        toast({
          title: 'Project Activated!',
          description: 'Your project has been successfully activated.',
        });

        // Wait a moment before closing and triggering success callback
        setTimeout(() => {
          onActivationSuccess();
          onClose();
          setStep('fee-display');
        }, 2000);
      } else {
        setStep('error');
        setErrorMessage(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStep('error');
      setErrorMessage('Failed to verify payment. Please try again.');
    }
  };

  const handleRetry = () => {
    setStep('fee-display');
    setErrorMessage('');
  };

  const renderFeeDisplayStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* <h3 className="text-lg font-semibold mb-2">
          Project Activation Required
        </h3> */}
        <p className="text-sm text-muted-foreground">
          To activate your project and start using bots, please pay the
          activation fee to the address below.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Activation Fee (USD)</span>
            <span className="text-xl font-bold">
              ${feeData?.setupFeeUSD || 0}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Amount in {feeData?.nativeCurrency}
            </span>
            <span className="text-lg font-semibold">
              {feeData?.nativeAmount.toFixed(6)} {feeData?.nativeCurrency}
            </span>
          </div>

          <div className="text-xs text-muted-foreground text-right">
            @ ${feeData?.nativePrice.toFixed(2)} per {feeData?.nativeCurrency}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Send Payment To</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  handleCopyAddress(feeData?.feeWalletAddress || '')
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={activationService.getExplorerUrl(
                    feeData?.feeWalletAddress || '',
                    project.chainName
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <code className="text-sm break-all">
              {feeData?.feeWalletAddress}
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Important:</p>
            <ul className="mt-1 text-yellow-700 space-y-1">
              <li>
                • Send exactly{' '}
                <strong>
                  {feeData?.nativeAmount.toFixed(6)} {feeData?.nativeCurrency}
                </strong>{' '}
                to the address above
              </li>
              <li>
                • Use the{' '}
                <strong>
                  {activationService.getNetworkName(project.chainName)}
                </strong>{' '}
                network
              </li>
              <li>• After sending, click "Verify Payment" below</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleVerifyPayment}
          disabled={!feeData}
          className="flex-1"
        >
          Verify Payment
        </Button>
      </div>
    </div>
  );

  const renderVerifyingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we verify your payment on the blockchain...
        </p>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Activated!</h3>
        <p className="text-sm text-muted-foreground">
          Your project has been successfully activated. You can now use all bot
          features.
        </p>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
        <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRetry}>Try Again</Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activate Project</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Loading activation details...
            </p>
          </div>
        ) : (
          <div className="py-4">
            {step === 'fee-display' && renderFeeDisplayStep()}
            {step === 'verifying' && renderVerifyingStep()}
            {step === 'success' && renderSuccessStep()}
            {step === 'error' && renderErrorStep()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
