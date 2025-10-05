import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { BotService } from '@/services/botService';
import { toggleBot } from '@/store/slices/botSlice';
import { fetchProject } from '@/store/slices/projectSlice';
import { AppDispatch, RootState } from '@/store/store';

interface HolderBotWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSuccess?: () => void;
}

export function HolderBotWizardDialog({
  open,
  onOpenChange,
  onConfigurationSuccess,
}: HolderBotWizardDialogProps) {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [targetHolders, setTargetHolders] = useState(
    currentProject?.addons?.HolderBot?.targetHolders || 0
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  const handleExecute = async () => {
    if (!currentProject?.addons?.HolderBot?._id) {
      toast({
        title: 'Error',
        description:
          'Cannot execute: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    setExecutionSuccess(false);

    try {
      // Configure the Holder Bot
      const result = await BotService.configureHolderBot({
        projectId: currentProject._id,
        botId: currentProject.addons.HolderBot._id,
        config: {
          targetHolders,
          botId: currentProject.addons.HolderBot._id,
          projectId: currentProject._id,
          tokenAddress: currentProject.tokenAddress,
          chainName: currentProject.chainName,
        },
      });

      if (result.status === 'success') {
        // Then enable the bot through Redux
        setTimeout(() => {
          dispatch(fetchProject(currentProject._id));
        }, 500);

        setIsExecuting(false);
        setExecutionSuccess(true);
        toast({
          title: 'Success',
          description:
            'Holder Bot configuration applied and started successfully',
        });

        // Call the success callback to enable the toggle
        onConfigurationSuccess?.();

        // Close the modal after successful configuration
        onOpenChange(false);
      } else {
        throw new Error(result.message || 'Configuration failed');
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to configure Holder Bot',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = async () => {
    if (!currentProject?.addons?.HolderBot?._id) {
      toast({
        title: 'Error',
        description: 'Cannot stop: Invalid state or missing bot configuration',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);

    try {
      // Update Redux state to disable the bot
      await dispatch(
        toggleBot({
          projectId: currentProject._id,
          botId: currentProject.addons.HolderBot._id,
          enabled: false,
        })
      ).unwrap();

      // Wait for Redux state to be updated
      await dispatch(fetchProject(currentProject._id));

      toast({
        title: 'Success',
        description: 'Holder Bot stopped successfully',
      });
    } catch (error: any) {
      toast({
        title: error.response?.data?.errorType || 'Error',
        description:
          error.response?.data?.errorMessage?.toString().slice(0, 200) ||
          'Failed to stop Holder Bot',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onOpenChange(false);
        setIsExecuting(false);
      }}
    >
      <DialogContent className="max-w-md">
        <Card className="border-none shadow-none">
          <DialogTitle>Holder Bot Configuration</DialogTitle>
          <DialogDescription className="space-y-4 mt-10">
            <div className="flex items-center space-x-4">
              <div className="flex-1 gap-2">
                <Label>Target Holders</Label>
                <input
                  type="number"
                  value={targetHolders}
                  onChange={(e) =>
                    setTargetHolders(parseInt(e.target.value, 10))
                  }
                  min={0}
                  className="w-full h-8 px-2 mt-2 rounded-md border border-input bg-background text-sm"
                  disabled={isExecuting}
                />
              </div>
            </div>
            <div className="pt-4">
              {currentProject?.addons?.HolderBot?.isEnabled ? (
                <Button
                  className="w-full"
                  onClick={handleStop}
                  disabled={isExecuting}
                  variant="destructive"
                >
                  {isExecuting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Stop Bot'
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleExecute}
                  disabled={
                    isExecuting ||
                    !currentProject?.addons?.HolderBot?._id ||
                    targetHolders === 0 ||
                    !targetHolders
                  }
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Configuration...
                    </>
                  ) : executionSuccess ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Apply & Start
                    </>
                  ) : (
                    'Apply & Start'
                  )}
                </Button>
              )}
            </div>
          </DialogDescription>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
