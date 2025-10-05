'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Plus,
  Settings,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define step type for better type safety
interface TutorialStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

export default function ProjectsTutorialPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 'choose-method',
      title: 'Choose Creation Method',
      description:
        'Decide between deploying a new token or importing existing one',
      icon: Plus,
    },
    {
      id: 'configure-details',
      title: 'Configure Project Details',
      description: 'Set up token parameters, network, and project information',
      icon: Settings,
    },
    {
      id: 'deploy-manage',
      title: 'Deploy & Manage',
      description: 'Create your project and start using Valmira tools',
      icon: Zap,
    },
  ];

  const scrollToSection = (stepIndex: number) => {
    setActiveStep(stepIndex);
    const element = document.getElementById(steps[stepIndex].id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextStep = () => {
    const nextStep = Math.min(steps.length - 1, activeStep + 1);
    scrollToSection(nextStep);
  };

  const goToPrevStep = () => {
    const prevStep = Math.max(0, activeStep - 1);
    scrollToSection(prevStep);
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tutorials">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tutorials
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              Project Management Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Complete Project Management Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to create, configure, and manage your token projects on
              Valmira from start to finish
            </p>
          </div>

          {/* Step Navigation */}
          <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => scrollToSection(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeStep === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Choose Creation Method */}
          <div id="choose-method" className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Creation Method</h2>
            <p className="text-muted-foreground">
              Decide between deploying a new token or importing existing one
            </p>

            {/* What & Why Section */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  What is a Project and Why Do You Need One?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    What is a Project?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    A project in Valmira is your central hub for managing
                    everything related to your token. Think of it as a control
                    center where you can deploy tokens, activate bots, monitor
                    performance, and manage all aspects of your token's market
                    presence.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">A Project Includes:</p>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <strong>Token Information:</strong> Contract address,
                        symbol, supply, and network details
                      </li>
                      <li>
                        <strong>Bot Management:</strong> All available bots
                        (Volume, Holder, Distribution, etc.)
                      </li>
                      <li>
                        <strong>Analytics Dashboard:</strong> Performance
                        metrics, trading data, and bot statistics
                      </li>
                      <li>
                        <strong>Wallet Management:</strong> Dedicated wallets
                        for each bot and function
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Configure Project Details */}
          <div id="configure-details" className="space-y-6">
            <h2 className="text-2xl font-bold">Configure Project Details</h2>
            <p className="text-muted-foreground">
              Set up token parameters, network, and project information
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Token Parameters</h3>
                    <ul className="space-y-2 text-sm">
                      <li>- Name and symbol</li>
                      <li>- Total supply</li>
                      <li>- Decimals</li>
                      <li>- Tax structure</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Network Settings</h3>
                    <ul className="space-y-2 text-sm">
                      <li>- Blockchain selection (BSC/ETH)</li>
                      <li>- RPC endpoints</li>
                      <li>- Gas settings</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important Notes</AlertTitle>
                  <AlertDescription>
                    Double-check all parameters before proceeding. Some settings
                    cannot be changed after deployment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Deploy & Manage */}
          <div id="deploy-manage" className="space-y-6">
            <h2 className="text-2xl font-bold">Deploy & Manage</h2>
            <p className="text-muted-foreground">
              Create your project and start using Valmira tools
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Deployment & Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Deployment Process</h3>
                    <ul className="space-y-2 text-sm">
                      <li>- Review all settings</li>
                      <li>- Confirm transaction in wallet</li>
                      <li>- Wait for blockchain confirmation</li>
                      <li>- Verify deployment status</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Post-Deployment</h3>
                    <ul className="space-y-2 text-sm">
                      <li>- Access project dashboard</li>
                      <li>- Set up bots and tools</li>
                      <li>- Configure monitoring</li>
                      <li>- Manage project settings</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Ready to Deploy?</AlertTitle>
                  <AlertDescription>
                    Once deployed, you'll have full access to all Valmira tools
                    and features for managing your token project.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={activeStep === 0}
            >
              Previous
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button onClick={goToNextStep}>Next</Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/projects">Go to Projects</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
