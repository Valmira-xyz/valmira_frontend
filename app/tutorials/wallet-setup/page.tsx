'use client';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  HelpCircle,
  Network,
  Settings,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

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

// Define step type for better type safety
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function WalletSetupTutorial() {
  const [activeStep, setActiveStep] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const steps: TutorialStep[] = [
    {
      id: 'choose-wallet',
      title: 'Choose Your Wallet',
      description: 'Select the best wallet for your needs and experience level',
      icon: Wallet,
    },
    {
      id: 'install-setup',
      title: 'Install & Setup',
      description: 'Download, install, and create your wallet securely',
      icon: Download,
    },
    {
      id: 'configure-networks',
      title: 'Configure Networks',
      description: 'Add BSC and ETH networks for Valmira compatibility',
      icon: Network,
    },
    {
      id: 'fund-connect',
      title: 'Fund & Connect',
      description: 'Add funds and connect to Valmira platform',
      icon: Settings,
    },
  ];

  const scrollToSection = (stepIndex: number) => {
    if (isScrolling) return;

    setActiveStep(stepIndex);
    const element = document.getElementById(steps[stepIndex].id);
    if (element) {
      setIsScrolling(true);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset scrolling state after animation completes
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      scrollToSection(activeStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (activeStep > 0) {
      scrollToSection(activeStep - 1);
    }
  };

  // Update active step based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;

      // const scrollPosition = window.scrollY + 100; // Add offset for fixed header

      for (let i = 0; i < steps.length; i++) {
        const element = document.getElementById(steps[i].id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveStep(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolling]);

  const wallets = [
    {
      name: 'MetaMask',
      type: 'Browser Extension',
      difficulty: 'Beginner',
      platforms: ['Desktop', 'Mobile'],
      pros: [
        'Most popular',
        'Great support',
        'Easy to use',
        'Wide compatibility',
      ],
      cons: ['Browser-based only', 'Requires extension'],
      recommended: true,
    },
    {
      name: 'Trust Wallet',
      type: 'Mobile App',
      difficulty: 'Beginner',
      platforms: ['Mobile'],
      pros: [
        'Mobile-first',
        'Built-in DApp browser',
        'User-friendly',
        'Good for BSC',
      ],
      cons: ['Mobile only', 'Limited desktop support'],
      recommended: false,
    },
    {
      name: 'WalletConnect',
      type: 'Protocol',
      difficulty: 'Intermediate',
      platforms: ['Any'],
      pros: ['Works with many wallets', 'Secure connection', 'Flexible'],
      cons: ['Requires existing wallet', 'More complex setup'],
      recommended: false,
    },
  ];

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
              Wallet Setup Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Complete Wallet Setup Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to choose, install, and configure a crypto wallet for
              seamless Valmira integration
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

          {/* What & Why Section */}
          <Card className="border" id="introduction">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What is a Crypto Wallet and Why Do You Need One?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  What is a Crypto Wallet?
                </h3>
                <p className="text-muted-foreground mb-4">
                  A crypto wallet is like a digital bank account that allows you
                  to store, send, and receive cryptocurrencies. Think of it as
                  your key to the blockchain world - it's what allows you to
                  interact with platforms like Valmira, manage your tokens, and
                  execute transactions. Unlike traditional bank accounts, you
                  have complete control over your wallet and funds.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">
                    A Crypto Wallet Allows You To:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Store Cryptocurrencies:</strong> Hold BNB, ETH,
                      and your custom tokens securely
                    </li>
                    <li>
                      <strong>Connect to DApps:</strong> Interact with platforms
                      like Valmira and other DeFi services
                    </li>
                    <li>
                      <strong>Sign Transactions:</strong> Approve bot
                      operations, token transfers, and other actions
                    </li>
                    <li>
                      <strong>Manage Multiple Networks:</strong> Switch between
                      BSC, Ethereum, and other blockchains
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Choose Your Wallet */}
          <div id="choose-wallet" className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Your Wallet</h2>
            <p className="text-muted-foreground">
              Select the best wallet for your needs and experience level
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Options Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {wallets.map((wallet, index) => (
                    <Card
                      key={index}
                      className={`border ${
                        wallet.recommended
                          ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                          : ''
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {wallet.recommended && (
                            <Badge variant="secondary">Recommended</Badge>
                          )}
                          {wallet.name}
                          <Badge variant="outline">{wallet.difficulty}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {wallet.type} - {wallet.platforms.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-green-600 mb-2">
                              Advantages:
                            </p>
                            <ul className="space-y-1">
                              {wallet.pros.map((pro, i) => (
                                <li key={i}>- {pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-orange-600 mb-2">
                              Considerations:
                            </p>
                            <ul className="space-y-1">
                              {wallet.cons.map((con, i) => (
                                <li key={i}>- {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Install & Setup */}
          <div id="install-setup" className="space-y-6">
            <h2 className="text-2xl font-bold">Install & Setup</h2>
            <p className="text-muted-foreground">
              Download, install, and create your wallet securely
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Installation Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    MetaMask Installation Steps:
                  </h3>
                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    <li>
                      Go to{' '}
                      <a
                        href="https://metamask.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        metamask.io
                      </a>{' '}
                      (verify the URL is correct)
                    </li>
                    <li>Click "Download" and choose your browser</li>
                    <li>Install the browser extension</li>
                    <li>Click "Create a Wallet" (or import if you have one)</li>
                    <li>Create a strong password</li>
                    <li className="font-bold">
                      CRITICAL: Write down your 12-word seed phrase on paper
                    </li>
                    <li>
                      Store the seed phrase in a safe place (never digital)
                    </li>
                    <li>Confirm your seed phrase to complete setup</li>
                  </ol>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Warning</AlertTitle>
                  <AlertDescription>
                    Never share your seed phrase or private keys with anyone.
                    Valmira support will never ask for this information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Configure Networks */}
          <div id="configure-networks" className="space-y-6">
            <h2 className="text-2xl font-bold">Configure Networks</h2>
            <p className="text-muted-foreground">
              Add BSC and ETH networks for Valmira compatibility
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Adding BSC Network:</h3>
                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    <li>
                      Click the network dropdown (usually shows "Ethereum
                      Mainnet")
                    </li>
                    <li>Click "Add Network" or "Custom RPC"</li>
                    <li>Enter BSC details:</li>
                  </ol>

                  <div className="ml-8 space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                    <p>
                      <strong>Network Name:</strong> Smart Chain
                    </p>
                    <p>
                      <strong>RPC URL:</strong>{' '}
                      https://bsc-dataseed.binance.org/
                    </p>
                    <p>
                      <strong>Chain ID:</strong> 56
                    </p>
                    <p>
                      <strong>Symbol:</strong> BNB
                    </p>
                    <p>
                      <strong>Block Explorer:</strong> https://bscscan.com
                    </p>
                  </div>

                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    <li>Click "Save" and switch to BSC network</li>
                  </ol>

                  <p className="text-sm text-muted-foreground mt-4">
                    <strong>Note:</strong> Ethereum mainnet is pre-configured in
                    MetaMask.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 4: Fund & Connect */}
          <div id="fund-connect" className="space-y-6">
            <h2 className="text-2xl font-bold">Fund & Connect</h2>
            <p className="text-muted-foreground">
              Add funds and connect to Valmira platform
            </p>

            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Connect to Valmira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Getting Your First Crypto:</h3>
                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    <li>
                      Buy BNB or ETH on a centralized exchange (Binance,
                      Coinbase, etc.)
                    </li>
                    <li>Copy your wallet address from MetaMask</li>
                    <li>
                      Withdraw from exchange to your wallet (start with a small
                      amount first)
                    </li>
                    <li>Wait for confirmation (usually 5-15 minutes)</li>
                  </ol>

                  <h3 className="font-semibold mt-6">Connecting to Valmira:</h3>
                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    <li>Go to Valmira platform</li>
                    <li>Click "Connect Wallet"</li>
                    <li>Select MetaMask and approve connection</li>
                    <li>You're ready to create your first project!</li>
                  </ol>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>All Set!</AlertTitle>
                  <AlertDescription>
                    Your wallet is now set up and ready to use with Valmira. You
                    can now create and manage your token projects.
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
              <Button onClick={goToNextStep}>
                Next: {steps[activeStep + 1]?.title}
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/projects">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
