'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Code,
  Copy,
  ExternalLink,
  HelpCircle,
  Monitor,
  Play,
  Settings,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleDriveVideoPlayer } from '@/components/ui/video-embed';

export default function TokenBoostIntegrationTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const integrationSteps = [
    {
      title: 'Setup & Configuration',
      description: 'Initial setup and basic configuration',
      icon: Settings,
    },
    {
      title: 'Code Integration',
      description: 'Implement the widget in your application',
      icon: Code,
    },
    {
      title: 'Customization',
      description: 'Customize appearance and functionality',
      icon: Monitor,
    },
    {
      title: 'Testing & Deployment',
      description: 'Test functionality and deploy to production',
      icon: Zap,
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
              TokenBoost Widget Integration
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              Complete TokenBoost Integration Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to integrate the TokenBoost widget into your application
              for seamless token project creation
            </p>
          </div>

          {/* Widget Integration Video Tutorial */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Video Tutorial
              </CardTitle>
              <CardDescription>
                Watch this comprehensive guide to learn everything about
                TokenBoost widget integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleDriveVideoPlayer
                driveLink="https://drive.google.com/file/d/1FS0Y1PUEyhdFOdJEF0M1jctr7nXGBPgX/view?usp=sharing"
                title="TokenBoost Widget Integration Complete Guide"
                description="Learn everything about widget integration including referral setup"
                showInfo={true}
              />
            </CardContent>
          </Card>

          {/* Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                TokenBoost Widget Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  What is TokenBoost Widget?
                </h3>
                <p className="text-muted-foreground mb-4">
                  The TokenBoost widget is a comprehensive embeddable component
                  that allows users to create and manage token projects directly
                  within your application. It provides the full Valmira
                  experience without requiring users to leave your platform.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Key Features:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Complete Project Creation:</strong> Deploy new
                      tokens or import existing ones
                    </li>
                    <li>
                      <strong>Bot Management:</strong> Configure and activate
                      all available bots
                    </li>
                    <li>
                      <strong>Real-time Analytics:</strong> Live performance
                      metrics and data
                    </li>
                    <li>
                      <strong>Mobile Responsive:</strong> Works seamlessly on
                      all devices
                    </li>
                    <li>
                      <strong>Customizable Branding:</strong> Match your
                      application's design
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Steps */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Step-by-Step Integration
              </CardTitle>
              <CardDescription>
                Follow these steps to integrate TokenBoost widget into your
                application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrationSteps.map((step, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    activeStep === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-full ${
                        activeStep === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        Step {index + 1}: {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {activeStep === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 space-y-4"
                    >
                      {index === 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">
                            1. Get Your Partner ID
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            First, you'll need to register as a partner and get
                            your unique partner ID from the ambassador
                            dashboard.
                          </p>
                          <div className="bg-muted p-3 rounded-lg">
                            <code className="text-sm">
                              partnerId: "amb_1234567890"
                            </code>
                          </div>

                          <h4 className="font-medium">
                            2. Choose Integration Method
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm">
                                iframe Embed
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Quick setup, no dependencies
                              </p>
                            </div>
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm">
                                JavaScript SDK
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Full control, event handling
                              </p>
                            </div>
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm">
                                React Component
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Type-safe, modern approach
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-4">
                          <Tabs defaultValue="iframe" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="iframe">iframe</TabsTrigger>
                              <TabsTrigger value="sdk">
                                JavaScript SDK
                              </TabsTrigger>
                              <TabsTrigger value="react">React</TabsTrigger>
                            </TabsList>

                            <TabsContent value="iframe" className="space-y-4">
                              <h4 className="font-medium">
                                iframe Integration
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                The simplest way to embed the widget. Just add
                                an iframe to your HTML.
                              </p>
                              <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm overflow-x-auto">
                                  {`<!-- Basic embed -->
<iframe 
  src="https://valmira.xyz/embed/tokenboost?partnerId=YOUR_PARTNER_ID"
  width="100%" 
  height="600"
  frameborder="0"
  style="border-radius: 8px; min-height: 600px;">
</iframe>

<!-- With custom parameters -->
<iframe 
  src="https://valmira.xyz/embed/tokenboost?partnerId=YOUR_PARTNER_ID&theme=dark&primaryColor=%233b82f6&autoDetect=true"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>`}
                                </pre>
                              </div>
                            </TabsContent>

                            <TabsContent value="sdk" className="space-y-4">
                              <h4 className="font-medium">
                                JavaScript SDK Integration
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Use our JavaScript SDK for advanced features and
                                event handling.
                              </p>
                              <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm overflow-x-auto">
                                  {`<!-- Include the SDK -->
<script src="https://valmira.xyz/tokenboost.js"></script>

<!-- Widget container -->
<div id="tokenboost-widget"></div>

<script>
// Wait for SDK to load
window.addEventListener('load', function() {
  if (window.ValmiraTokenBoost) {
    // Configure the widget
    window.ValmiraTokenBoost.updateConfig({
      partnerId: 'YOUR_PARTNER_ID',
      theme: 'light',
      primaryColor: '#3b82f6',
      autoDetect: true
    });

    // Set up event listeners
    window.ValmiraTokenBoost.on('projectCreated', function(data) {
      console.log('Project created:', data);
      // Handle project creation
    });

    window.ValmiraTokenBoost.on('error', function(error) {
      console.error('Widget error:', error);
    });

    // Open the widget
    window.ValmiraTokenBoost.open();
  }
});
</script>`}
                                </pre>
                              </div>
                            </TabsContent>

                            <TabsContent value="react" className="space-y-4">
                              <h4 className="font-medium">React Component</h4>
                              <p className="text-sm text-muted-foreground">
                                Type-safe React component with proper TypeScript
                                support.
                              </p>
                              <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm overflow-x-auto">
                                  {`import React, { useEffect, useRef } from 'react';

interface TokenBoostWidgetProps {
  partnerId: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  autoDetect?: boolean;
  onProjectCreated?: (data: any) => void;
  onError?: (error: any) => void;
}

const TokenBoostWidget: React.FC<TokenBoostWidgetProps> = ({
  partnerId,
  theme = 'light',
  primaryColor = '#3b82f6',
  autoDetect = true,
  onProjectCreated,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load the SDK
    const script = document.createElement('script');
    script.src = 'https://valmira.xyz/tokenboost.js';
    script.onload = () => {
      if (window.ValmiraTokenBoost) {
        window.ValmiraTokenBoost.updateConfig({
          partnerId,
          theme,
          primaryColor,
          autoDetect
        });

        if (onProjectCreated) {
          window.ValmiraTokenBoost.on('projectCreated', onProjectCreated);
        }
        
        if (onError) {
          window.ValmiraTokenBoost.on('error', onError);
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [partnerId, theme, primaryColor, autoDetect, onProjectCreated, onError]);

  const widgetUrl = \`https://valmira.xyz/embed/tokenboost?partnerId=\${partnerId}&theme=\${theme}&primaryColor=\${encodeURIComponent(primaryColor)}&autoDetect=\${autoDetect}\`;
  
  return (
    <iframe
      ref={iframeRef}
      src={widgetUrl}
      width="100%"
      height="600"
      frameBorder="0"
      style={{ borderRadius: '8px' }}
      title="TokenBoost Widget"
    />
  );
};

export default TokenBoostWidget;`}
                                </pre>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Configuration Options</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">
                                Basic Options
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <code>partnerId</code>
                                  <span className="text-muted-foreground">
                                    Your partner ID
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>theme</code>
                                  <span className="text-muted-foreground">
                                    'light' | 'dark'
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>primaryColor</code>
                                  <span className="text-muted-foreground">
                                    Hex color code
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>autoDetect</code>
                                  <span className="text-muted-foreground">
                                    Auto-detect tokens
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">
                                Advanced Options
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <code>autoOpen</code>
                                  <span className="text-muted-foreground">
                                    Open automatically
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>position</code>
                                  <span className="text-muted-foreground">
                                    Widget position
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>allowedOrigins</code>
                                  <span className="text-muted-foreground">
                                    Security origins
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <code>customCSS</code>
                                  <span className="text-muted-foreground">
                                    Custom styling
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Alert>
                            <Settings className="h-4 w-4" />
                            <AlertTitle>Configuration Example</AlertTitle>
                            <AlertDescription>
                              <div className="mt-2 bg-muted p-3 rounded-lg">
                                <pre className="text-xs">
                                  {`const config = {
  partnerId: 'amb_1234567890',
  theme: 'dark',
  primaryColor: '#3b82f6',
  autoDetect: true,
  autoOpen: false,
  position: 'bottom-right'
};`}
                                </pre>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {index === 3 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">
                            Testing Your Integration
                          </h4>
                          <div className="space-y-3">
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-2">
                                1. Local Testing
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Test the widget in your local development
                                environment first.
                              </p>
                            </div>
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-2">
                                2. Event Verification
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Ensure all event handlers are working correctly.
                              </p>
                            </div>
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-2">
                                3. Mobile Testing
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Verify the widget works on mobile devices and
                                different screen sizes.
                              </p>
                            </div>
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-2">
                                4. Production Deployment
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Deploy to staging first, then production with
                                monitoring.
                              </p>
                            </div>
                          </div>

                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Ready for Production</AlertTitle>
                            <AlertDescription>
                              Once testing is complete, your TokenBoost widget
                              integration is ready for production use!
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Event Handling */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Event Handling & SDK Methods
              </CardTitle>
              <CardDescription>
                Handle widget events and use SDK methods for advanced
                functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="methods">SDK Methods</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                  <h4 className="font-medium">Available Events</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">
                        strategy-deployed
                      </h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Fired when a user successfully deploys a strategy or
                        creates a project.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`ValmiraTokenBoost.on('strategy-deployed', (data) => {
  console.log('Strategy deployed:', data);
  // data contains strategy deployment information
});`}
                        </pre>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">widget-error</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Fired when an error occurs within the widget.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`ValmiraTokenBoost.on('widget-error', (error) => {
  console.error('Widget error:', error);
  // Handle error appropriately
});`}
                        </pre>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">error</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Fired when an error occurs within the widget.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`ValmiraTokenBoost.on('error', (error) => {
  console.error('Widget error:', error);
  // Handle error appropriately
});`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="methods" className="space-y-4">
                  <h4 className="font-medium">SDK Methods</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">
                        open() / close()
                      </h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Programmatically open or close the widget.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`// Open the widget
ValmiraTokenBoost.open();

// Close the widget
ValmiraTokenBoost.close();

// Check if widget is open
if (ValmiraTokenBoost.isOpen()) {
  console.log('Widget is currently open');
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">
                        updateConfig()
                      </h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Update widget configuration dynamically.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`ValmiraTokenBoost.updateConfig({
  theme: 'dark',
  primaryColor: '#ff6b35',
  autoDetect: false
});`}
                        </pre>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">setTokens()</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Pre-populate the widget with specific token data.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs">
                          {`ValmiraTokenBoost.setTokens([
  {
    address: '0x1234...5678',
    name: 'My Token',
    symbol: 'MTK',
    decimals: 18
  }
]);`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="space-y-4">
                  <h4 className="font-medium">Complete Integration Examples</h4>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">
                        Basic Integration with Analytics
                      </h5>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-x-auto">
                          {`// Initialize widget with analytics tracking
window.addEventListener('load', function() {
  if (window.ValmiraTokenBoost) {
    // Configure widget
    window.ValmiraTokenBoost.updateConfig({
      partnerId: 'amb_1234567890',
      theme: 'light',
      primaryColor: '#3b82f6'
    });

    // Track project creation for analytics
    window.ValmiraTokenBoost.on('projectCreated', function(data) {
      // Send to your analytics
      gtag('event', 'project_created', {
        'token_address': data.tokenAddress,
        'token_symbol': data.tokenSymbol
      });
      
      // Show success message
      showNotification('Project created successfully!');
    });

    // Handle errors gracefully
    window.ValmiraTokenBoost.on('error', function(error) {
      console.error('TokenBoost error:', error);
      showErrorMessage('Something went wrong. Please try again.');
    });
  }
});`}
                        </pre>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-2">
                        Advanced React Integration
                      </h5>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-x-auto">
                          {`import React, { useEffect, useState } from 'react';

const TokenBoostIntegration = ({ partnerId, onProjectCreated }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load SDK
    const script = document.createElement('script');
    script.src = 'https://valmira.xyz/tokenboost.js';
    script.onload = () => {
      setIsLoaded(true);
      
      if (window.ValmiraTokenBoost) {
        // Configure widget
        window.ValmiraTokenBoost.updateConfig({
          partnerId,
          theme: 'light',
          primaryColor: '#3b82f6'
        });

        // Set up event handlers
        window.ValmiraTokenBoost.on('projectCreated', (data) => {
          onProjectCreated?.(data);
        });

        window.ValmiraTokenBoost.on('error', (err) => {
          setError(err.message);
        });
      }
    };
    
    script.onerror = () => {
      setError('Failed to load TokenBoost SDK');
    };
    
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [partnerId, onProjectCreated]);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!isLoaded) {
    return <div className="loading">Loading TokenBoost...</div>;
  }

  return (
    <div className="tokenboost-container">
      <iframe
        src={\`https://valmira.xyz/embed/tokenboost?partnerId=\${partnerId}\`}
        width="100%"
        height="600"
        frameBorder="0"
        style={{ borderRadius: '8px' }}
      />
    </div>
  );
};`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Configuration Reference */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Reference
              </CardTitle>
              <CardDescription>
                Complete list of all available configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Required Parameters</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">partnerId</code>
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your unique partner identifier from the ambassador
                        dashboard
                      </p>
                    </div>
                  </div>

                  <h4 className="font-medium">Styling Options</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">theme</code>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Widget theme: 'light' | 'dark' (default: 'light')
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">
                          primaryColor
                        </code>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Primary color in hex format (default: '#3b82f6')
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Behavior Options</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">autoDetect</code>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-detect tokens on the page (default: true)
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">autoOpen</code>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Open widget automatically on load (default: false)
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-medium">position</code>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Widget position: 'bottom-right' | 'bottom-left' |
                        'top-right' | 'top-left'
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Copy className="h-4 w-4" />
                <AlertTitle>Complete Configuration Example</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {`const widgetConfig = {
  partnerId: 'amb_1234567890',
  theme: 'dark',
  primaryColor: '#3b82f6',
  autoDetect: true,
  autoOpen: false,
  position: 'bottom-right',
  allowedOrigins: ['https://yoursite.com'],
  customCSS: '.widget-container { border-radius: 12px; }'
};

// Apply configuration
ValmiraTokenBoost.updateConfig(widgetConfig);`}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Integrate TokenBoost?
                </h3>
                <p className="text-muted-foreground">
                  Start with the iframe integration for quick setup, then
                  explore advanced options
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/embed/tokenboost" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Widget
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/widgets/customization">
                      Customization Guide
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
