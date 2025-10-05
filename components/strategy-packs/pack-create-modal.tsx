'use client';

import { useState } from 'react';

import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { PackConfigModal } from '@/components/strategy-packs/pack-config-modal';
import { PackDeployModal } from '@/components/strategy-packs/pack-deploy-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CreateStrategyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export enum StrategyPackStep {
  PACK_CONFIGURATION = 'pack-configuration',
  PROJECT_CREATION = 'project-creation',
  PACK_DEPLOYMENT = 'pack-deployment',
}

export function CreateStrategyPackModal({
  isOpen,
  onClose,
}: CreateStrategyPackModalProps) {
  const [currentStep, setCurrentStep] = useState<StrategyPackStep>(
    StrategyPackStep.PACK_CONFIGURATION
  );
  const [packConfig, setPackConfig] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);

  const handlePackConfigured = (config: any) => {
    console.log('Pack configured:', config);
    setPackConfig(config);
    setCurrentStep(StrategyPackStep.PROJECT_CREATION);
  };

  const handleProjectCreated = (project: any) => {
    console.log('Project created:', project);
    setProjectData(project);
    setCurrentStep(StrategyPackStep.PACK_DEPLOYMENT);
  };

  const handlePackDeployed = () => {
    console.log('Pack deployed successfully');
    // Reset state and close modal
    setCurrentStep(StrategyPackStep.PACK_CONFIGURATION);
    setPackConfig(null);
    setProjectData(null);
    onClose();
  };

  const handleClose = () => {
    // Reset state when modal is closed
    setCurrentStep(StrategyPackStep.PACK_CONFIGURATION);
    setPackConfig(null);
    setProjectData(null);
    onClose();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case StrategyPackStep.PACK_CONFIGURATION:
        return (
          <PackConfigModal
            isOpen={true}
            onClose={handleClose}
            onNext={handlePackConfigured}
            projectData={null}
          />
        );
      case StrategyPackStep.PROJECT_CREATION:
        return (
          <CreateProjectModal
            isOpen={true}
            onClose={handleClose}
            onProjectCreated={handleProjectCreated}
            isStrategyPackMode={true}
            packConfig={packConfig}
            hideDialog={true}
          />
        );
      case StrategyPackStep.PACK_DEPLOYMENT:
        return (
          <PackDeployModal
            isOpen={true}
            onClose={handleClose}
            onComplete={handlePackDeployed}
            _projectData={projectData}
            _packConfig={packConfig}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
}
