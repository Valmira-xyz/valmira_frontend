'use client';

import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface PackDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  _projectData: any;
  _packConfig: any;
}

export function PackDeployModal({
  isOpen,
  onClose,
  onComplete,
  _projectData,
  _packConfig,
}: PackDeployModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(
    'Configuring bots and optimizing'
  );
  const [isDeploying, setIsDeploying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate deployment process
    const steps = [
      { text: 'Configuring bots and optimizing', duration: 2000 },
      { text: 'Setting up Volume Bot', duration: 1500 },
      { text: 'Setting up Liquidity Bot', duration: 1500 },
      { text: 'Setting up Price Stabilizer', duration: 1500 },
      { text: 'Finalizing configuration', duration: 1000 },
    ];

    let currentStepIndex = 0;
    let currentProgress = 0;

    const runStep = () => {
      if (currentStepIndex >= steps.length) {
        setProgress(100);
        setCurrentStep('Deployment complete!');
        setIsDeploying(false);
        setIsComplete(true);
        return;
      }

      const step = steps[currentStepIndex];
      setCurrentStep(step.text);

      const stepProgress = 100 / steps.length;
      const targetProgress = (currentStepIndex + 1) * stepProgress;

      // Animate progress
      const progressInterval = setInterval(() => {
        currentProgress += 2;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(progressInterval);
          currentStepIndex++;
          setTimeout(runStep, 200);
        }
        setProgress(currentProgress);
      }, 50);
    };

    const timeout = setTimeout(runStep, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [isOpen]);

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="p-6">
      <DialogHeader>
        <DialogTitle>
          {isComplete ? 'Deployment Complete!' : 'Deploy Market Maker Pro'}
        </DialogTitle>
        <DialogDescription>
          {isComplete
            ? 'Your strategy pack has been successfully deployed and configured.'
            : 'This will take a moment...'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-8">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            {isDeploying && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {isComplete && (
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium">
              {isComplete ? 'Deploy Market Maker Pro' : currentStep}
            </h3>
            {!isComplete && (
              <p className="text-sm text-muted-foreground mt-1">
                This will take moment...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>

        {/* Current Step Details */}
        <div className="text-center text-sm text-muted-foreground">
          {currentStep}
        </div>
      </div>

      <DialogFooter>
        {isComplete ? (
          <Button onClick={handleComplete} className="w-full">
            Deploy Packs
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} disabled={isDeploying}>
            Cancel
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}
