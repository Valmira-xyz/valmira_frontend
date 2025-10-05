'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle,
  Globe,
  HelpCircle,
  Monitor,
  Search,
  Settings,
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

export default function WidgetTroubleshootingTutorial() {
  const [searchTerm, setSearchTerm] = useState('');

  const commonIssues = [
    {
      id: 'widget-not-loading',
      title: 'Widget Not Loading',
      category: 'loading',
      severity: 'high',
      description: 'The TokenBoost widget fails to load or appears blank',
      symptoms: ['Blank iframe', 'Loading spinner stuck', 'Console errors'],
      causes: [
        'Incorrect partner ID',
        'Network connectivity issues',
        'CORS policy restrictions',
        'JavaScript errors on parent page',
      ],
      solutions: [
        'Verify your partner ID is correct',
        'Check browser console for errors',
        'Ensure proper CORS configuration',
        'Test in incognito mode to rule out extensions',
      ],
      code: `// Debug widget loading
console.log('Partner ID:', 'YOUR_PARTNER_ID');
console.log('Widget URL:', 'https://valmira.xyz/embed/tokenboost?partnerId=YOUR_PARTNER_ID');

// Check if widget is loaded
if (window.ValmiraTokenBoost) {
  console.log('SDK loaded successfully');
  // Basic widget status check
  console.log('Widget available:', typeof window.ValmiraTokenBoost);
} else {
  console.error('SDK not loaded');
}`,
    },
    {
      id: 'mobile-display-issues',
      title: 'Mobile Display Issues',
      category: 'mobile',
      severity: 'medium',
      description: 'Widget appears incorrectly on mobile devices',
      symptoms: [
        'Overlapping elements',
        'Text too small',
        'Buttons not clickable',
      ],
      causes: [
        'Viewport meta tag missing',
        'CSS conflicts with parent page',
        'Touch events not properly handled',
      ],
      solutions: [
        'Add proper viewport meta tag',
        'Use mobile-specific configuration',
        'Test on actual devices, not just emulators',
      ],
      code: `// Mobile-optimized configuration
ValmiraTokenBoost.updateConfig({
  mobile: {
    fullscreen: true,
    touchOptimized: true,
    swipeGestures: true
  },
  responsive: true
});`,
    },
    {
      id: 'authentication-errors',
      title: 'Authentication Errors',
      category: 'auth',
      severity: 'high',
      description: 'Users cannot connect wallets or authenticate',
      symptoms: [
        'Wallet connection fails',
        '401 errors',
        'Authentication timeout',
      ],
      causes: [
        'Invalid API credentials',
        'Wallet extension conflicts',
        'Network switching issues',
      ],
      solutions: [
        'Verify API key configuration',
        'Check wallet extension compatibility',
        'Implement proper error handling',
      ],
      code: `// Handle authentication errors
ValmiraTokenBoost.on('error', (error) => {
  if (error.type === 'authentication') {
    console.error('Auth error:', error.message);
    // Show user-friendly error message
    showErrorMessage('Please check your wallet connection');
  }
});`,
    },
    {
      id: 'performance-issues',
      title: 'Performance Issues',
      category: 'performance',
      severity: 'medium',
      description: 'Widget loads slowly or causes page performance issues',
      symptoms: ['Slow loading times', 'Page freezing', 'High memory usage'],
      causes: ['Large bundle size', 'Memory leaks', 'Inefficient rendering'],
      solutions: [
        'Implement lazy loading',
        'Optimize widget configuration',
        'Monitor performance metrics',
      ],
      code: `// Performance optimization
ValmiraTokenBoost.updateConfig({
  lazyLoad: true,
  preloadImages: false,
  animations: {
    duration: 200, // Faster animations
    easing: 'ease-out'
  }
});`,
    },
    {
      id: 'browser-compatibility',
      title: 'Browser Compatibility',
      category: 'compatibility',
      severity: 'medium',
      description: "Widget doesn't work in certain browsers",
      symptoms: ['Features not working', 'Layout broken', 'JavaScript errors'],
      causes: [
        'Unsupported browser features',
        'Polyfills missing',
        'Browser-specific bugs',
      ],
      solutions: [
        'Check browser support matrix',
        'Include necessary polyfills',
        'Implement feature detection',
      ],
      code: `// Browser compatibility check
if (!window.ValmiraTokenBoost) {
  console.warn('Browser not supported');
  // Show fallback content
  document.getElementById('widget-fallback').style.display = 'block';
}`,
    },
  ];

  const debugSteps = [
    {
      title: 'Check Console Errors',
      description:
        'Open browser developer tools and look for JavaScript errors',
      action: 'Press F12 → Console tab',
    },
    {
      title: 'Verify Network Requests',
      description: 'Check if widget resources are loading correctly',
      action: 'Developer Tools → Network tab → Reload page',
    },
    {
      title: 'Test in Incognito Mode',
      description: 'Rule out browser extensions and cached data',
      action: 'Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)',
    },
    {
      title: 'Check Widget Configuration',
      description: 'Verify all configuration parameters are correct',
      action: 'Review partner ID, theme, and other settings',
    },
  ];

  const filteredIssues = commonIssues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Widget Troubleshooting
            </Badge>
            <h1 className="text-4xl font-bold font-tt tracking-tight">
              TokenBoost Widget Troubleshooting Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Common issues, solutions, and debugging techniques for TokenBoost
              widget integration
            </p>
          </div>

          {/* Search */}
          <Card className="border">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for issues, error messages, or symptoms..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Debug Steps */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Quick Debug Steps
              </CardTitle>
              <CardDescription>
                Start here when experiencing widget issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debugSteps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {step.action}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Issues */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Issues & Solutions
              </CardTitle>
              <CardDescription>
                {filteredIssues.length} issue
                {filteredIssues.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredIssues.map((issue) => (
                  <AccordionItem key={issue.id} value={issue.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            issue.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {issue.severity}
                        </Badge>
                        <span className="font-medium">{issue.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p className="text-muted-foreground">
                        {issue.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2">Symptoms</h5>
                          <ul className="space-y-1 text-sm">
                            {issue.symptoms.map((symptom, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Possible Causes</h5>
                          <ul className="space-y-1 text-sm">
                            {issue.causes.map((cause, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Solutions</h5>
                        <ol className="space-y-2 text-sm">
                          {issue.solutions.map((solution, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="font-medium text-primary">
                                {index + 1}.
                              </span>
                              {solution}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {issue.code && (
                        <div>
                          <h5 className="font-medium mb-2">Code Example</h5>
                          <div className="bg-muted p-3 rounded-lg">
                            <pre className="text-xs overflow-x-auto">
                              {issue.code}
                            </pre>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Browser Support */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Browser Support Matrix
              </CardTitle>
              <CardDescription>
                Supported browsers and known limitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Fully Supported</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Chrome 90+</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Firefox 88+</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Safari 14+</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Edge 90+</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Limited Support</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Internet Explorer</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Chrome &lt; 90</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span>Safari &lt; 14</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertTitle>Browser Testing</AlertTitle>
                  <AlertDescription>
                    Always test your widget integration in the browsers your
                    users actually use. Check your analytics to prioritize
                    testing efforts.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Debug Tools */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Debug Tools & Utilities
              </CardTitle>
              <CardDescription>
                Built-in debugging features and external tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="built-in" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="built-in">Built-in Debug</TabsTrigger>
                  <TabsTrigger value="external">External Tools</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="built-in" className="space-y-4">
                  <h4 className="font-medium">Built-in Debug Features</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Enable Debug Mode
                      </h5>
                      <pre className="text-xs">
                        {`// Basic configuration update
ValmiraTokenBoost.updateConfig({
  partnerId: 'YOUR_PARTNER_ID',
  theme: 'light'
});

// Listen for widget errors
ValmiraTokenBoost.on('widget-error', function(error) {
  console.error('Widget error:', error);
});

// Check if configuration was applied
console.log('Widget configured successfully');`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Performance Monitoring
                      </h5>
                      <pre className="text-xs">
                        {`// Monitor widget performance
ValmiraTokenBoost.on('performance', (metrics) => {
  console.log('Load time:', metrics.loadTime);
  console.log('Memory usage:', metrics.memoryUsage);
  console.log('Render time:', metrics.renderTime);
});

// Get current analytics
const analytics = ValmiraTokenBoost.getAnalytics();
console.log('Widget analytics:', analytics);`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="external" className="space-y-4">
                  <h4 className="font-medium">External Debug Tools</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2">
                        Browser Developer Tools
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        Use Console, Network, and Performance tabs to diagnose
                        issues
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2">
                        React Developer Tools
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        Inspect React components and state (for React
                        integrations)
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2">Lighthouse</h5>
                      <p className="text-xs text-muted-foreground">
                        Audit performance, accessibility, and best practices
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <h4 className="font-medium">Production Monitoring</h4>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Error Tracking
                      </h5>
                      <pre className="text-xs">
                        {`// Set up error tracking
ValmiraTokenBoost.on('error', (error) => {
  // Send to your error tracking service
  Sentry.captureException(error);
  
  // Or use your preferred service
  LogRocket.captureException(error);
  Bugsnag.notify(error);
});`}
                      </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Performance Monitoring
                      </h5>
                      <pre className="text-xs">
                        {`// Track performance metrics
ValmiraTokenBoost.on('performance', (metrics) => {
  // Send to analytics
  gtag('event', 'widget_performance', {
    load_time: metrics.loadTime,
    memory_usage: metrics.memoryUsage
  });
  
  // Alert on poor performance
  if (metrics.loadTime > 3000) {
    console.warn('Widget loading slowly:', metrics.loadTime);
  }
});`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Get Help */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Still Need Help?</h3>
                <p className="text-muted-foreground">
                  If you can't find a solution here, our support team is ready
                  to help
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/support">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/widgets/api-reference">
                      API Reference
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
