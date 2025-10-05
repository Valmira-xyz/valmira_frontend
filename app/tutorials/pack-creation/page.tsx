'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle,
  Clock,
  DollarSign,
  HelpCircle,
  Package,
  Play,
  Settings,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleDriveVideoPlayer } from '@/components/ui/video-embed';

// Define step type for better type safety
interface PackCreationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function PackCreationTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const steps: PackCreationStep[] = [
    {
      id: 'pack-overview',
      title: 'Understanding Strategy Packs',
      description: 'Learn what strategy packs are and how they work',
      icon: Package,
      estimatedTime: '5 min',
      difficulty: 'Beginner',
    },
    {
      id: 'pack-creation',
      title: 'Creating Your First Pack',
      description: 'Step-by-step guide to create a new strategy pack',
      icon: Zap,
      estimatedTime: '10 min',
      difficulty: 'Beginner',
    },
    {
      id: 'bot-configuration',
      title: 'Bot Configuration',
      description: 'Configure bots and their parameters within your pack',
      icon: Bot,
      estimatedTime: '15 min',
      difficulty: 'Intermediate',
    },
    {
      id: 'advanced-settings',
      title: 'Advanced Pack Settings',
      description: 'Fine-tune advanced parameters and risk management',
      icon: Settings,
      estimatedTime: '20 min',
      difficulty: 'Advanced',
    },
    {
      id: 'testing-deployment',
      title: 'Testing & Deployment',
      description: 'Test your pack and deploy it for live trading',
      icon: Target,
      estimatedTime: '10 min',
      difficulty: 'Intermediate',
    },
  ];

  const packFeatures = [
    {
      title: 'Multi-Bot Coordination',
      description: 'Coordinate multiple bots working together',
      icon: Bot,
    },
    {
      title: 'Risk Management',
      description: 'Built-in risk controls and safety measures',
      icon: Shield,
    },
    {
      title: 'Performance Tracking',
      description: 'Monitor and analyze pack performance',
      icon: Target,
    },
    {
      title: 'Cost Optimization',
      description: 'Optimize gas costs and trading efficiency',
      icon: DollarSign,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
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

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              Strategy Pack Tutorial
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Complete Pack Creation & Configuration Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to create, configure, and deploy powerful strategy packs
              for automated trading
            </p>
          </div>

          {/* Overview Video Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Tutorial Overview
              </CardTitle>
              <CardDescription>
                Watch this comprehensive overview before diving into the
                step-by-step guide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleDriveVideoPlayer
                driveLink="https://drive.google.com/file/d/1QVM16z8u3s73Li9I_1M3BxtJDX4A16ch/view"
                title="Strategy Pack Creation Overview"
                description="Complete walkthrough of the pack creation process (10 minutes)"
                showInfo={true}
              />
            </CardContent>
          </Card>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="step-by-step" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step-by-step">Step-by-Step Guide</TabsTrigger>
              <TabsTrigger value="configuration">
                Configuration Deep Dive
              </TabsTrigger>
              <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            </TabsList>

            {/* Step-by-Step Tab */}
            <TabsContent value="step-by-step" className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Steps Navigation */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Tutorial Steps</CardTitle>
                      <CardDescription>
                        Follow these steps to create your strategy pack
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = activeStep === index;
                        const isCompleted = activeStep > index;

                        return (
                          <button
                            key={step.id}
                            onClick={() => setActiveStep(index)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : isCompleted
                                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                  : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Icon className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {step.title}
                                </div>
                                <div className="text-xs opacity-70 truncate">
                                  {step.description}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getDifficultyColor(step.difficulty)}`}
                                  >
                                    {step.difficulty}
                                  </Badge>
                                  <span className="text-xs opacity-50 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {step.estimatedTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Step Content */}
                <div className="lg:col-span-2 space-y-6">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = activeStep === index;

                    if (!isActive) return null;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="border">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-xl">
                                  Step {index + 1}: {step.title}
                                </CardTitle>
                                <CardDescription className="text-base">
                                  {step.description}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant="outline"
                                  className={getDifficultyColor(
                                    step.difficulty
                                  )}
                                >
                                  {step.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {step.estimatedTime}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Step-specific content */}
                            {index === 0 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  What are Strategy Packs?
                                </h3>
                                <p className="text-muted-foreground">
                                  Strategy packs are pre-configured collections
                                  of trading bots that work together to execute
                                  complex trading strategies. They allow you to
                                  coordinate multiple bots with different
                                  functions to achieve your trading goals.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                  {packFeatures.map((feature, idx) => {
                                    const FeatureIcon = feature.icon;
                                    return (
                                      <Card key={idx} className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                          <FeatureIcon className="h-5 w-5 text-primary" />
                                          <h4 className="font-medium">
                                            {feature.title}
                                          </h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {feature.description}
                                        </p>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {index === 1 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Creating Your First Pack
                                </h3>
                                <ol className="list-decimal pl-5 space-y-3 text-muted-foreground">
                                  <li>
                                    Navigate to the "Strategy Packs" section in
                                    your dashboard
                                  </li>
                                  <li>Click the "Create New Pack" button</li>
                                  <li>
                                    Choose a descriptive name for your pack
                                  </li>
                                  <li>Select the base project for your pack</li>
                                  <li>Define your pack's trading objectives</li>
                                  <li>Set initial risk parameters</li>
                                </ol>

                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Important</AlertTitle>
                                  <AlertDescription>
                                    Make sure you have sufficient funds in your
                                    project wallet before creating a pack. Each
                                    pack requires a minimum balance to operate
                                    effectively.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}

                            {index === 2 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Bot Configuration
                                </h3>
                                <p className="text-muted-foreground">
                                  Configure the individual bots that will make
                                  up your strategy pack:
                                </p>

                                <Accordion
                                  type="single"
                                  collapsible
                                  className="w-full"
                                >
                                  <AccordionItem value="volume-bot">
                                    <AccordionTrigger>
                                      Volume Bot Configuration
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li>Set trading volume targets</li>
                                        <li>Configure buy/sell ratios</li>
                                        <li>Define timing intervals</li>
                                        <li>Set maximum slippage tolerance</li>
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="holder-bot">
                                    <AccordionTrigger>
                                      Holder Bot Configuration
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li>
                                          Set minimum holder count targets
                                        </li>
                                        <li>Configure wallet distribution</li>
                                        <li>Define holding periods</li>
                                        <li>Set diversification parameters</li>
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="distribution-bot">
                                    <AccordionTrigger>
                                      Distribution Bot Configuration
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li>Set distribution schedules</li>
                                        <li>Configure recipient wallets</li>
                                        <li>Define distribution amounts</li>
                                        <li>Set timing parameters</li>
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )}

                            {index === 3 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Advanced Pack Settings
                                </h3>
                                <div className="grid gap-4">
                                  <Card className="p-4">
                                    <h4 className="font-medium mb-2">
                                      Risk Management
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      <li>• Maximum daily loss limits</li>
                                      <li>• Stop-loss triggers</li>
                                      <li>• Emergency shutdown conditions</li>
                                      <li>• Position size limits</li>
                                    </ul>
                                  </Card>
                                  <Card className="p-4">
                                    <h4 className="font-medium mb-2">
                                      Performance Optimization
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      <li>• Gas optimization settings</li>
                                      <li>• Transaction timing</li>
                                      <li>• MEV protection</li>
                                      <li>• Slippage management</li>
                                    </ul>
                                  </Card>
                                </div>
                              </div>
                            )}

                            {index === 4 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Testing & Deployment
                                </h3>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">
                                      Pre-Deployment Checklist
                                    </h4>
                                    <div className="space-y-2">
                                      {[
                                        'Verify all bot configurations',
                                        'Check wallet balances',
                                        'Test with small amounts first',
                                        'Review risk parameters',
                                        'Confirm emergency stop procedures',
                                      ].map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                          <span className="text-sm">
                                            {item}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <Alert>
                                    <Shield className="h-4 w-4" />
                                    <AlertTitle>Safety First</AlertTitle>
                                    <AlertDescription>
                                      Always start with small amounts when
                                      testing a new pack configuration. Monitor
                                      performance closely for the first 24
                                      hours.
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between pt-4">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setActiveStep(Math.max(0, activeStep - 1))
                                }
                                disabled={activeStep === 0}
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous
                              </Button>
                              <Button
                                onClick={() =>
                                  setActiveStep(
                                    Math.min(steps.length - 1, activeStep + 1)
                                  )
                                }
                                disabled={activeStep === steps.length - 1}
                              >
                                Next Step
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Configuration Deep Dive Tab */}
            <TabsContent value="configuration" className="space-y-8">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Configuration Tutorial
                  </CardTitle>
                  <CardDescription>
                    Deep dive into pack configuration with detailed examples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleDriveVideoPlayer
                    driveLink="https://drive.google.com/file/d/1dSdQLi9cD0hkGmlLr9EDzkWSmbjbWN5r/view"
                    title="Advanced Pack Configuration"
                    description="Detailed walkthrough of advanced configuration options (15 minutes)"
                    showInfo={true}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bot Coordination</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Learn how to coordinate multiple bots to work together
                      effectively:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li>• Sequential vs parallel execution</li>
                      <li>• Dependency management</li>
                      <li>• Timing coordination</li>
                      <li>• Resource sharing</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Parameter Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Optimize your pack parameters for maximum efficiency:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li>• Gas cost optimization</li>
                      <li>• Timing optimization</li>
                      <li>• Risk-reward balancing</li>
                      <li>• Performance monitoring</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Best Practices Tab */}
            <TabsContent value="best-practices" className="space-y-8">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pack Creation Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">
                          ✅ Do's
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• Start with simple configurations</li>
                          <li>• Test thoroughly before deployment</li>
                          <li>• Monitor performance regularly</li>
                          <li>• Keep detailed configuration notes</li>
                          <li>• Use conservative risk settings initially</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">
                          ❌ Don'ts
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• Don't deploy without testing</li>
                          <li>• Don't use maximum risk settings</li>
                          <li>• Don't ignore warning messages</li>
                          <li>• Don't run multiple conflicting packs</li>
                          <li>• Don't forget to set stop-loss limits</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Common Pitfalls & Solutions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="insufficient-funds">
                        <AccordionTrigger>
                          Insufficient Funds Error
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            This error occurs when your project wallet doesn't
                            have enough balance.
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Check your project wallet balance</li>
                            <li>• Reduce pack size or bot quantities</li>
                            <li>• Add more funds to your project</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="bot-conflicts">
                        <AccordionTrigger>
                          Bot Configuration Conflicts
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Conflicts arise when bots have contradictory
                            objectives.
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Review bot objectives for conflicts</li>
                            <li>• Adjust timing to avoid overlaps</li>
                            <li>• Use sequential execution when needed</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="performance-issues">
                        <AccordionTrigger>
                          Poor Pack Performance
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Performance issues can stem from various
                            configuration problems.
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Review and optimize gas settings</li>
                            <li>• Check market conditions</li>
                            <li>• Adjust timing parameters</li>
                            <li>• Monitor for MEV attacks</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-2">Quick Links</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/strategy-packs">View Strategy Packs</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/tutorials/best-practices">
                        Best Practices Guide
                      </Link>
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Related Tutorials</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/tutorials/add-ons/volume-bot">
                        Volume Bot Tutorial
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/tutorials/add-ons/holder-bot">
                        Holder Bot Tutorial
                      </Link>
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Support</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/tutorials/widgets/troubleshooting">
                        Troubleshooting
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/faqs">FAQ</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
