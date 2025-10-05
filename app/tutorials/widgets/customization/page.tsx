'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  HelpCircle,
  Monitor,
  Palette,
  Settings,
  Smartphone,
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

export default function WidgetCustomizationTutorial() {
  const customizationOptions = [
    {
      category: 'Branding',
      description: 'Customize visual identity and brand elements',
      options: [
        'Logo placement and sizing',
        'Brand colors and themes',
        'Custom fonts and typography',
        'White-label options',
      ],
    },
    {
      category: 'Layout',
      description: 'Control widget size and responsive behavior',
      options: [
        'Widget dimensions',
        'Responsive breakpoints',
        'Mobile optimization',
        'Container styling',
      ],
    },
    {
      category: 'Features',
      description: 'Enable or disable specific functionality',
      options: [
        'Available bot types',
        'Network selection',
        'Advanced settings',
        'Help documentation',
      ],
    },
    {
      category: 'Styling',
      description: 'Advanced visual customization',
      options: [
        'Custom CSS injection',
        'Theme variations',
        'Animation preferences',
        'Component styling',
      ],
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
              Widget Customization Tutorial
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Widget Customization Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to customize Valmira widgets to match your brand and
              provide the perfect user experience
            </p>
          </div>

          {/* Customization Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Customization Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  What You Can Customize
                </h3>
                <p className="text-muted-foreground mb-4">
                  Valmira widgets are highly customizable to ensure they
                  integrate seamlessly with your brand and user experience. From
                  basic color changes to complete white-label solutions, you
                  have full control over how the widget appears and behaves.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {customizationOptions.map((option, index) => (
                    <Card key={index} className="border">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {option.category}
                        </CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {option.options.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customization Methods */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Customization Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="url-parameters" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="url-parameters">
                    URL Parameters
                  </TabsTrigger>
                  <TabsTrigger value="css-styling">CSS Styling</TabsTrigger>
                  <TabsTrigger value="api-config">
                    API Configuration
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url-parameters" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      URL Parameter Customization
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      The simplest way to customize widgets is through URL
                      parameters. These allow basic customization without any
                      code changes.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`<!-- Basic customization -->
https://valmira.xyz/embed/tokenboost?theme=dark&network=bsc

<!-- Advanced customization -->
https://valmira.xyz/embed/tokenboost?
  theme=dark&
  network=bsc&
  primaryColor=%23007bff&
  hideHeader=true&
  compactMode=true&
  referral=your-code

<!-- Available parameters -->
- theme: light, dark, auto
- network: bsc, eth
- primaryColor: hex color code
- hideHeader: true/false
- compactMode: true/false
- referral: your referral code
- lang: en, es, fr, de, etc.`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="css-styling" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Custom CSS Styling</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      For advanced styling, you can inject custom CSS to
                      completely transform the widget appearance.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`/* Custom CSS injection */
<style>
  .valmira-widget {
    --primary-color: #your-brand-color;
    --background-color: #your-bg-color;
    --text-color: #your-text-color;
    --border-radius: 12px;
    --font-family: 'Your Font', sans-serif;
  }
  
  /* Override specific components */
  .valmira-widget .header {
    background: linear-gradient(45deg, #color1, #color2);
  }
  
  .valmira-widget .button-primary {
    background: var(--primary-color);
    border-radius: var(--border-radius);
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 768px) {
    .valmira-widget {
      --border-radius: 8px;
    }
  }
</style>`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="api-config" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">API Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      For dynamic customization and white-label solutions, use
                      the configuration API.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`// JavaScript SDK configuration
TokenBoost.init({
  container: '#widget-container',
  config: {
    branding: {
      logo: 'https://your-site.com/logo.png',
      primaryColor: '#007bff',
      fontFamily: 'Inter, sans-serif',
      hideValmiraBranding: true // Premium feature
    },
    layout: {
      width: '100%',
      height: '600px',
      responsive: true,
      compactMode: false
    },
    features: {
      enabledBots: ['volume', 'holder', 'distribution'],
      defaultNetwork: 'bsc',
      showAdvancedOptions: false
    },
    styling: {
      theme: 'light',
      borderRadius: '8px',
      customCSS: 'your-custom-styles.css'
    }
  }
});`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Responsive Design */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Responsive Design & Mobile Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Mobile-First Approach
                </h3>
                <p className="text-muted-foreground mb-4">
                  All Valmira widgets are built with a mobile-first approach,
                  ensuring excellent user experience across all devices. Here's
                  how to optimize for different screen sizes.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Mobile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Breakpoint:</strong> &lt; 768px
                      </p>
                      <p>
                        <strong>Layout:</strong> Single column, stacked elements
                      </p>
                      <p>
                        <strong>Features:</strong> Simplified interface,
                        touch-optimized
                      </p>
                      <p>
                        <strong>Height:</strong> Auto-adjusting based on content
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Tablet
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Breakpoint:</strong> 768px - 1024px
                      </p>
                      <p>
                        <strong>Layout:</strong> Two-column layout
                      </p>
                      <p>
                        <strong>Features:</strong> Balanced interface
                      </p>
                      <p>
                        <strong>Height:</strong> Fixed height with scrolling
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Desktop
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Breakpoint:</strong> &gt; 1024px
                      </p>
                      <p>
                        <strong>Layout:</strong> Full multi-column layout
                      </p>
                      <p>
                        <strong>Features:</strong> Complete interface with all
                        options
                      </p>
                      <p>
                        <strong>Height:</strong> Optimized for larger screens
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">
                  Responsive Implementation
                </h4>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {`<!-- Responsive iframe wrapper -->
<div class="widget-responsive-wrapper">
  <iframe 
    src="https://valmira.xyz/embed/tokenboost"
    frameborder="0">
  </iframe>
</div>

<style>
.widget-responsive-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
}

.widget-responsive-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .widget-responsive-wrapper {
    padding-bottom: 100%; /* Square aspect ratio on mobile */
  }
}
</style>`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding Examples */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Brand Integration Examples
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Crypto Exchange Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="bg-muted p-3 rounded">
                        <p>
                          <strong>Colors:</strong> Dark theme with blue accents
                        </p>
                        <p>
                          <strong>Typography:</strong> Roboto Mono for technical
                          feel
                        </p>
                        <p>
                          <strong>Layout:</strong> Compact mode for sidebar
                          integration
                        </p>
                        <p>
                          <strong>Features:</strong> Focus on advanced trading
                          tools
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                        <code className="text-xs">
                          ?theme=dark&primaryColor=%230066cc&compactMode=true&hideHeader=true
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Educational Platform
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="bg-muted p-3 rounded">
                        <p>
                          <strong>Colors:</strong> Light theme with green
                          accents
                        </p>
                        <p>
                          <strong>Typography:</strong> Open Sans for readability
                        </p>
                        <p>
                          <strong>Layout:</strong> Full-width with explanatory
                          text
                        </p>
                        <p>
                          <strong>Features:</strong> Beginner-friendly interface
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded">
                        <code className="text-xs">
                          ?theme=light&primaryColor=%2328a745&showHelp=true&beginnerMode=true
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testing & Preview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Testing & Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertTitle>Preview Your Customizations</AlertTitle>
                <AlertDescription>
                  Always test your customizations across different devices and
                  browsers before deploying to production.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Testing Checklist</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Visual Testing:</p>
                    <ul className="space-y-1 ml-4">
                      <li>- Brand colors display correctly</li>
                      <li>- Typography renders properly</li>
                      <li>- Layout adapts to different screen sizes</li>
                      <li>- Custom CSS doesn't break functionality</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Functional Testing:</p>
                    <ul className="space-y-1 ml-4">
                      <li>- All features work as expected</li>
                      <li>- Forms submit correctly</li>
                      <li>- Navigation flows properly</li>
                      <li>- Error states display appropriately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Ready to Customize Your Widget?
                </h3>
                <p className="text-muted-foreground">
                  Start with URL parameters for quick changes, then explore
                  advanced CSS customization
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/embed/tokenboost?theme=dark" target="_blank">
                      Preview Dark Theme
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
