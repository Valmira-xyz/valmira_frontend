import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FeeConfig } from '@/services/feeService';

interface ProjectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectFee: FeeConfig;
  onSave: (updatedFee: FeeConfig) => void;
}

const ProjectFeeModal: React.FC<ProjectFeeModalProps> = ({
  isOpen,
  onClose,
  projectFee,
  onSave,
}) => {
  const [localFee, setLocalFee] = useState<FeeConfig>(projectFee);

  const handleChange = (field: keyof FeeConfig, value: any) => {
    setLocalFee((prev: FeeConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(localFee);
    onClose();
  };

  const handleCancel = () => {
    setLocalFee(projectFee); // Reset to original values
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project Fees</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project Setup Fee</Label>
            <Input
              type="number"
              value={localFee.projectSetupFee}
              onChange={(e) =>
                handleChange('projectSetupFee', parseFloat(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Daily Bot Fee</Label>
            <Input
              type="number"
              value={localFee.dailyBotFee}
              onChange={(e) =>
                handleChange('dailyBotFee', parseFloat(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Liquidation Bot Profit %</Label>
            <Input
              type="number"
              value={localFee.liquidationBotProfitPercentage}
              onChange={(e) =>
                handleChange(
                  'liquidationBotProfitPercentage',
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Volume Bot Percentage</Label>
            <Input
              type="number"
              value={localFee.volumeBotPercentage}
              onChange={(e) =>
                handleChange('volumeBotPercentage', parseFloat(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Bundle Snipe Percentage</Label>
            <Input
              type="number"
              value={localFee.bundleSnipePercentage}
              onChange={(e) =>
                handleChange(
                  'bundleSnipePercentage',
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Distribution Bot Percentage</Label>
            <Input
              type="number"
              value={localFee.distributionBotPercentage}
              onChange={(e) =>
                handleChange(
                  'distributionBotPercentage',
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Bundle Snipe Execution Fee</Label>
            <Input
              type="number"
              value={localFee.bundleSnipeExecutionFee}
              onChange={(e) =>
                handleChange(
                  'bundleSnipeExecutionFee',
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Distribution Wallet Fee</Label>
            <Input
              type="number"
              value={localFee.distributionWalletFee}
              onChange={(e) =>
                handleChange(
                  'distributionWalletFee',
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          {/* <div className="space-y-2">
            <Label>Daily Fee Cap</Label>
            <Input
              type="number"
              value={localFee.dailyFeeCap}
              onChange={(e) =>
                handleChange('dailyFeeCap', parseFloat(e.target.value))
              }
            />
          </div> */}
          {/* <div className="space-y-2">
            <Label>Monthly Fee Cap</Label>
            <Input
              type="number"
              value={localFee.monthlyFeeCap}
              onChange={(e) =>
                handleChange('monthlyFeeCap', parseFloat(e.target.value))
              }
            />
          </div> */}
          {/* <div className="space-y-2">
            <Label>Liquidation Profit Minimum</Label>
            <Input
              type="number"
              value={localFee.liquidationProfitMinimum}
              onChange={(e) =>
                handleChange(
                  'liquidationProfitMinimum',
                  parseFloat(e.target.value)
                )
              }
            />
          </div> */}
          <div className="space-y-2">
            <Label>Is Active</Label>
            <Switch
              checked={localFee.isActive}
              onChange={(e) =>
                handleChange('isActive', (e.target as HTMLInputElement).checked)
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFeeModal;
