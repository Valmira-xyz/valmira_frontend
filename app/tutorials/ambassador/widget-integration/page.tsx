'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Code,
  ExternalLink,
  HelpCircle,
  Monitor,
  Settings,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

export default function WidgetIntegrationTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const integrationSteps = [
    {
      title: 'Generate Widget Code',
      description: 'Create your customized widget embed code in the dashboard',
      icon: Code,
    },
    {
      title: 'Customize Appearance',
      description: 'Configure widget styling and branding options',
      icon: Settings,
    },
    {
      title: 'Embed on Website',
      description: 'Add the widget code to your website or platform',
      icon: Monitor,
    },
    {
      title: 'Test & Optimize',
      description: 'Verify functionality and optimize for conversions',
      icon: Zap,
    },
  ];

  const widgetTypes = [
    {
      name: 'TokenBoost Widget',
      description:
        'Full-featured widget for token project creation and management',
      features: [
        'Complete project setup',
        'Bot configuration',
        'Real-time analytics',
        'Mobile responsive',
      ],
      useCase: 'Perfect for crypto education sites and token launch platforms',
      size: 'Large (800x600px)',
    },
    {
      name: 'Quick Launch Widget',
      description: 'Simplified widget for fast project creation',
      features: [
        'Streamlined setup',
        'Essential bots only',
        'Quick deployment',
        'Compact design',
      ],
      useCase: 'Ideal for landing pages and marketing campaigns',
      size: 'Medium (600x400px)',
    },
    {
      name: 'Referral Widget',
      description: 'Focused widget for ambassador program promotion',
      features: [
        'Ambassador signup',
        'Commission calculator',
        'Success stories',
        'Social sharing',
      ],
      useCase: 'Great for influencer partnerships and affiliate marketing',
      size: 'Small (400x300px)',
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
              Widget Integration Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Valmira Widget Integration Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to integrate Valmira widgets into your website to earn
              commissions and provide value to your audience
            </p>
          </div>

          {/* Widget Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What are Valmira Widgets?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Widget System Overview
                </h3>
                <p className="text-muted-foreground mb-4">
                  Valmira widgets are embeddable components that allow you to
                  integrate Valmira's functionality directly into your website.
                  They provide a seamless user experience while automatically
                  tracking referrals and generating commissions for you. Think
                  of them as mini-applications that bring Valmira's power to
                  your audience without requiring them to leave your site.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Widget Benefits:</p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Seamless Integration:</strong> Users stay on your
                      site while accessing Valmira features
                    </li>
                    <li>
                      <strong>Automatic Referral Tracking:</strong> All widget
                      users are automatically attributed to you
                    </li>
                    <li>
                      <strong>Customizable Branding:</strong> Match your site's
                      design and branding
                    </li>
                    <li>
                      <strong>Mobile Responsive:</strong> Works perfectly on all
                      devices and screen sizes
                    </li>
                    <li>
                      <strong>Real-time Analytics:</strong> Track widget
                      performance and user engagement
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  How Widgets Generate Revenue
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Automatic Attribution</p>
                        <p className="text-sm text-muted-foreground">
                          All widget users become your referrals automatically
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Lifetime Commissions</p>
                        <p className="text-sm text-muted-foreground">
                          Earn from all future activity of widget users
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Higher Conversion</p>
                        <p className="text-sm text-muted-foreground">
                          Embedded experience increases signup rates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Value Addition</p>
                        <p className="text-sm text-muted-foreground">
                          Provide real value to your audience
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget Types */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Available Widget Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {widgetTypes.map((widget, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{widget.name}</CardTitle>
                        <Badge variant="outline">{widget.size}</Badge>
                      </div>
                      <CardDescription>{widget.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">Key Features:</p>
                        <div className="grid md:grid-cols-2 gap-2">
                          {widget.features.map((feature, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Best Use Case:</p>
                        <p className="text-sm text-muted-foreground">
                          {widget.useCase}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Steps */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Step-by-Step Integration Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {integrationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                      activeStep === index
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30'
                    }`}
                    onClick={() => setActiveStep(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeStep === index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-3">
                        {step.description}
                      </p>

                      {activeStep === index && (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Generating Your Widget Code:</strong>
                          </p>
                          <p>
                            1. Go to Ambassador Dashboard Widget Integration
                          </p>
                          <p>
                            2. Select your preferred widget type (TokenBoost,
                            Quick Launch, or Referral)
                          </p>
                          <p>3. Configure basic settings:</p>
                          <p className="ml-4">- Widget size and layout</p>
                          <p className="ml-4">
                            - Default network (BSC recommended)
                          </p>
                          <p className="ml-4">- Language and region settings</p>
                          <p>
                            4. Your unique referral tracking is automatically
                            embedded
                          </p>
                          <p>5. Copy the generated embed code</p>
                          <p>
                            <strong>Code Format:</strong> Standard iframe or
                            JavaScript embed options available
                          </p>
                        </div>
                      )}

                      {activeStep === index && (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Customization Options:</strong>
                          </p>
                          <p>
                            1. <strong>Branding:</strong> Upload your logo and
                            set brand colors
                          </p>
                          <p>
                            2. <strong>Styling:</strong> Choose from preset
                            themes or create custom CSS
                          </p>
                          <p>
                            3. <strong>Content:</strong> Customize welcome
                            messages and call-to-actions
                          </p>
                          <p>
                            4. <strong>Features:</strong> Enable/disable
                            specific functionality
                          </p>
                          <p>
                            5. <strong>Mobile Optimization:</strong> Adjust
                            responsive breakpoints
                          </p>
                          <p>
                            <strong>Advanced Options:</strong>
                          </p>
                          <p>- Custom domain integration</p>
                          <p>- White-label branding (premium feature)</p>
                          <p>- Custom success/error messages</p>
                        </div>
                      )}

                      {activeStep === index && (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Website Integration Methods:</strong>
                          </p>
                          <p>
                            1. <strong>Direct HTML:</strong> Paste iframe code
                            directly into your HTML
                          </p>
                          <p>
                            2. <strong>WordPress:</strong> Use custom HTML block
                            or shortcode plugin
                          </p>
                          <p>
                            3. <strong>React/Next.js:</strong> Use provided
                            React component
                          </p>
                          <p>
                            4. <strong>CMS Integration:</strong> Most platforms
                            support iframe embeds
                          </p>
                          <p>
                            <strong>Placement Recommendations:</strong>
                          </p>
                          <p>- Landing pages for maximum visibility</p>
                          <p>- Blog posts about token creation</p>
                          <p>- Resource pages and tutorials</p>
                          <p>- Footer or sidebar for persistent access</p>
                        </div>
                      )}

                      {activeStep === index && (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Testing and Optimization:</strong>
                          </p>
                          <p>
                            1. <strong>Functionality Test:</strong> Complete a
                            full user journey
                          </p>
                          <p>
                            2. <strong>Mobile Testing:</strong> Verify
                            responsive behavior on all devices
                          </p>
                          <p>
                            3. <strong>Performance Check:</strong> Ensure fast
                            loading times
                          </p>
                          <p>
                            4. <strong>Analytics Setup:</strong> Monitor widget
                            performance metrics
                          </p>
                          <p>
                            <strong>Optimization Strategies:</strong>
                          </p>
                          <p>- A/B test different placements</p>
                          <p>- Monitor conversion rates and adjust</p>
                          <p>- Gather user feedback and iterate</p>
                          <p>- Track referral attribution accuracy</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Implementation */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Implementation Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                  <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Basic HTML Integration
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`<!-- Basic TokenBoost Widget -->
<iframe 
  src="https://valmira.xyz/embed/tokenboost?ref=your-username"
  width="800" 
  height="600"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>

<!-- Responsive wrapper -->
<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
  <iframe 
    src="https://valmira.xyz/embed/tokenboost?ref=your-username"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0">
  </iframe>
</div>`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="react" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      React Component Integration
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`import React from 'react';

const ValmiraWidget = ({ 
  type = 'tokenboost', 
  referralCode = 'your-username',
  width = '800',
  height = '600' 
}) => {
  const widgetUrl = \`https://valmira.xyz/embed/\${type}?ref=\${referralCode}\`;
  
  return (
    <div className="valmira-widget-container">
      <iframe
        src={widgetUrl}
        width={width}
        height={height}
        frameBorder="0"
        style={{ borderRadius: '8px', maxWidth: '100%' }}
        title="Valmira Widget"
      />
    </div>
  );
};

export default ValmiraWidget;`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="wordpress" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      WordPress Integration
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">
                          Method 1: Custom HTML Block
                        </p>
                        <p>1. Add a "Custom HTML" block to your page/post</p>
                        <p>2. Paste the iframe code from the HTML tab</p>
                        <p>3. Preview and publish</p>
                      </div>
                      <div>
                        <p className="font-medium mb-2">
                          Method 2: Shortcode (requires plugin)
                        </p>
                        <div className="bg-muted p-3 rounded">
                          <code>
                            [valmira_widget type="tokenboost"
                            ref="your-username" width="800" height="600"]
                          </code>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-2">
                          Method 3: Theme Integration
                        </p>
                        <p>
                          Add to your theme's functions.php or template files
                          for site-wide integration
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Advanced Integration Features
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">
                          JavaScript SDK Integration
                        </p>
                        <div className="bg-muted p-3 rounded">
                          <code>{`<script src="https://valmira.xyz/sdk/widget.js"></script>
<script>
  ValmiraWidget.init({
    container: '#valmira-widget',
    type: 'tokenboost',
    referralCode: 'your-username',
    theme: 'dark',
    onSuccess: (data) => console.log('User created project:', data),
    onError: (error) => console.error('Widget error:', error)
  });
</script>`}</code>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-2">Event Tracking</p>
                        <ul className="space-y-1 ml-4">
                          <li>- Track widget loads and user interactions</li>
                          <li>
                            - Monitor conversion events and referral attribution
                          </li>
                          <li>
                            - Custom analytics integration (Google Analytics,
                            etc.)
                          </li>
                          <li>- Real-time performance monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Performance & Analytics */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Widget Performance & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="analytics">
                  <AccordionTrigger>Analytics & Tracking</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Built-in Analytics</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Widget Views:</strong> Track how many people
                          see your widget
                        </li>
                        <li>
                          <strong>Interaction Rate:</strong> Percentage of
                          viewers who interact with the widget
                        </li>
                        <li>
                          <strong>Conversion Rate:</strong> Users who complete
                          project creation
                        </li>
                        <li>
                          <strong>Referral Attribution:</strong> Accurate
                          tracking of widget-generated referrals
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Custom Analytics Integration
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Google Analytics:</strong> Track widget events
                          as custom goals
                        </li>
                        <li>
                          <strong>Facebook Pixel:</strong> Monitor widget
                          conversions for ad optimization
                        </li>
                        <li>
                          <strong>Custom Tracking:</strong> Use JavaScript
                          events for your own analytics
                        </li>
                        <li>
                          <strong>A/B Testing:</strong> Test different widget
                          configurations
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="optimization">
                  <AccordionTrigger>Performance Optimization</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Loading Performance
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Lazy Loading:</strong> Widget loads only when
                          visible on screen
                        </li>
                        <li>
                          <strong>CDN Delivery:</strong> Fast global content
                          delivery
                        </li>
                        <li>
                          <strong>Optimized Assets:</strong> Compressed images
                          and minified code
                        </li>
                        <li>
                          <strong>Caching:</strong> Intelligent caching for
                          repeat visitors
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Conversion Optimization
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Strategic Placement:</strong> Position widgets
                          where users are most engaged
                        </li>
                        <li>
                          <strong>Clear Value Proposition:</strong> Highlight
                          benefits prominently
                        </li>
                        <li>
                          <strong>Reduced Friction:</strong> Minimize steps
                          required to get started
                        </li>
                        <li>
                          <strong>Social Proof:</strong> Display success stories
                          and testimonials
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>Common Issues & Solutions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Integration Issues</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Widget Not Loading:</strong> Check iframe src
                          URL and network connectivity
                        </li>
                        <li>
                          <strong>Responsive Issues:</strong> Ensure proper CSS
                          container styling
                        </li>
                        <li>
                          <strong>Referral Not Tracking:</strong> Verify
                          referral code in embed URL
                        </li>
                        <li>
                          <strong>Styling Conflicts:</strong> Use iframe
                          isolation or custom CSS
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Performance Issues</h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Slow Loading:</strong> Implement lazy loading
                          and check network speed
                        </li>
                        <li>
                          <strong>Mobile Problems:</strong> Test responsive
                          design on actual devices
                        </li>
                        <li>
                          <strong>Browser Compatibility:</strong> Test across
                          different browsers and versions
                        </li>
                        <li>
                          <strong>Security Warnings:</strong> Ensure HTTPS and
                          proper CSP headers
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Integrate Valmira Widgets?
                </h3>
                <p className="text-muted-foreground">
                  Start earning commissions by providing Valmira's tools
                  directly on your website
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/ambassador">Generate Widget Code</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/embed/tokenboost" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Widget
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
