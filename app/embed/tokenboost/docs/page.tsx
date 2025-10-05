'use client';

declare global {
  interface Window {
    ValmiraTokenBoost: {
      open: () => void;
      close: () => void;
      setTokens: (tokens: any[]) => void;
      updateConfig: (config: any) => void;
      on: (event: string, callback: (data: any) => void) => void;
      off: (event: string, callback?: (data: any) => void) => void;
      isOpen: () => boolean;
      isReady: () => boolean;
      getConfig: () => any;
      getTokens: () => any[];
    };
    ValmiraTokenBoostDebug?: any;
  }

  const ValmiraTokenBoost: Window['ValmiraTokenBoost'];
}

import {
  AlertTriangle,
  CheckCircle,
  Code,
  ExternalLink,
  MessageSquare,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TokenBoostDocsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          TokenBoost Widget Documentation
        </h1>
        <p className="text-muted-foreground">
          Complete guide for integrating the TokenBoost widget into your
          platform.
        </p>
      </div>

      <Tabs defaultValue="quickstart" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Get Your Partner ID</h3>
                <p className="text-muted-foreground mb-2">
                  Contact the Valmira team to get your unique partner ID and
                  referral code.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Partner IDs are required for commission tracking and
                    analytics.
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Add the Script Tag</h3>
                <p className="text-muted-foreground mb-2">
                  Add this script tag to your HTML page where you want the
                  widget to appear:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  {`<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="YOUR_PARTNER_ID"
  data-theme="light"
  data-primary-color="#3b82f6">
</script>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Control the Widget</h3>
                <p className="text-muted-foreground mb-2">
                  Use JavaScript to control when and how the widget appears:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  {`// Open the widget
ValmiraTokenBoost.open();

// Set token data (optional)
ValmiraTokenBoost.setTokens([{
  address: '0x...',
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18
}]);

// Listen for events
ValmiraTokenBoost.on('strategy-deployed', (data) => {
  console.log('Strategy deployed!', data);
});`}
                </pre>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  That's it! The widget will handle wallet connection,
                  authentication, and strategy deployment automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Configuration Attributes</h3>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">data-partner-id</code>
                    <Badge className="ml-2" variant="destructive">
                      Required
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your unique partner identifier for commission tracking.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">data-theme</code>
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Widget theme: <code>light</code>, <code>dark</code>, or{' '}
                      <code>auto</code>. Default: <code>light</code>
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      data-primary-color
                    </code>
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Primary color for buttons and highlights. Default:{' '}
                      <code>#3b82f6</code>
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">data-position</code>
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Widget position: <code>bottom-right</code>,{' '}
                      <code>bottom-left</code>, <code>top-right</code>,{' '}
                      <code>top-left</code>, <code>center</code>
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">data-trigger-text</code>
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Custom text for the trigger button. Default:{' '}
                      <code>Boost Your Token</code>
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">data-auto-open</code>
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto-open widget on page load. Default: <code>false</code>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">JavaScript API Methods</h3>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.open()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Opens the widget modal.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.close()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Closes the widget modal.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.setTokens(tokens)
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pre-fills token data. Accepts a single token object or
                      array of tokens.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.updateConfig(config)
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Updates widget configuration dynamically.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.on(event, callback)
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registers an event listener.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.off(event, callback)
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Removes an event listener.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">State Getters</h3>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.isOpen()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Returns true if widget is currently open.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.isReady()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Returns true if widget is loaded and ready.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.getConfig()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Returns current widget configuration.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <code className="font-mono text-sm">
                      ValmiraTokenBoost.getTokens()
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Returns currently set token data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Event System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The widget emits events that you can listen to for custom
                integration logic.
              </p>

              <div className="space-y-4">
                <div className="border rounded p-4">
                  <h4 className="font-semibold mb-2">widget-ready</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fired when the widget is fully loaded and ready to use.
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    {`ValmiraTokenBoost.on('widget-ready', (data) => {
  console.log('Widget ready:', data);
  // { 'data-partner-id': 'YOUR_ID', user: { address: '0x...', id: '...' } }
});`}
                  </pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold mb-2">widget-opened</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fired when the widget modal is opened.
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    {`ValmiraTokenBoost.on('widget-opened', (data) => {
  // Track analytics
  analytics.track('tokenboost_widget_opened');
});`}
                  </pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold mb-2">widget-closed</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fired when the widget modal is closed.
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    {`ValmiraTokenBoost.on('widget-closed', (data) => {
  // Handle widget close
  console.log('Widget closed');
});`}
                  </pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold mb-2">strategy-deployed</h4>
                  <Badge className="mb-2" variant="default">
                    Most Important
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fired when a user successfully deploys a market making
                    strategy.
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    {`ValmiraTokenBoost.on('strategy-deployed', (data) => {
  console.log('Strategy deployed:', data);
  // {
  //   'data-partner-id': 'YOUR_ID',
  //   strategy: {
  //     id: 'strategy_123',
  //     type: 'market_maker',
  //     token: { address: '0x...', symbol: 'MTK' },
  //     budget: 1000,
  //     duration: 30
  //   },
  //   user: { address: '0x...', id: '...' }
  // }

  // Show success message
  showSuccessNotification(\`Market making started for \${data.strategy.token.symbol}!\`);

  // Track conversion
  analytics.track('strategy_deployed', {
    token: data.strategy.token.symbol,
    strategy_type: data.strategy.type,
    partner: data['data-partner-id']
  });
});`}
                  </pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold mb-2">widget-error</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fired when an error occurs in the widget.
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                    {`ValmiraTokenBoost.on('widget-error', (data) => {
  console.error('Widget error:', data.error);
  // { error: { code: 'AUTH_FAILED', message: '...' } }

  // Handle specific errors
  if (data.error.code === 'AUTH_FAILED') {
    showErrorMessage('Please connect your wallet to continue.');
  }
});`}
                  </pre>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Events are also dispatched as DOM events with the prefix{' '}
                  <code>valmira-</code> for frameworks that prefer DOM event
                  handling.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Origin Validation</h3>
                <p className="text-muted-foreground mb-2">
                  By default, the widget accepts messages from any origin. For
                  production, specify allowed origins:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded">
                  {`<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="YOUR_ID"
  data-allowed-origins="yourdomain.com,app.yourdomain.com">
</script>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Content Security Policy</h3>
                <p className="text-muted-foreground mb-2">
                  Add these CSP directives to allow the widget to function:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded">
                  {`Content-Security-Policy:
  script-src 'self' https://valmira.xyz;
  frame-src https://valmira.xyz;
  connect-src https://valmira.xyz;`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Privacy</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    The widget only accesses wallet addresses that users
                    explicitly connect
                  </li>
                  <li>No private keys or sensitive data are transmitted</li>
                  <li>All communication uses HTTPS encryption</li>
                  <li>Partner IDs are used only for commission tracking</li>
                </ul>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  The widget runs in a sandboxed iframe with restricted
                  permissions for maximum security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="styling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Styling & Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Theme Customization</h3>
                <p className="text-muted-foreground mb-2">
                  The widget supports light, dark, and auto themes:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                  {`// Set theme via attribute
data-theme="dark"

// Or update dynamically
ValmiraTokenBoost.updateConfig({
  theme: 'dark',
  primaryColor: '#ff6b35'
});`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Custom Colors</h3>
                <p className="text-muted-foreground mb-2">
                  Customize the primary color to match your brand:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Popular Brand Colors</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: '#1DA1F2' }}
                        ></div>
                        <code>#1DA1F2</code> (Twitter Blue)
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: '#FF6B35' }}
                        ></div>
                        <code>#FF6B35</code> (Orange)
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: '#8B5CF6' }}
                        ></div>
                        <code>#8B5CF6</code> (Purple)
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: '#10B981' }}
                        ></div>
                        <code>#10B981</code> (Green)
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Position Options</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <code>bottom-right</code> (default)
                      </div>
                      <div>
                        <code>bottom-left</code>
                      </div>
                      <div>
                        <code>top-right</code>
                      </div>
                      <div>
                        <code>top-left</code>
                      </div>
                      <div>
                        <code>center</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Custom Trigger Button</h3>
                <p className="text-muted-foreground mb-2">
                  Hide the default trigger and create your own:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                  {`<!-- Hide default trigger -->
<style>
  #valmira-tokenboost-trigger { display: none !important; }
</style>

<!-- Your custom button -->
<button onclick="ValmiraTokenBoost.open()" class="my-custom-button">
  🚀 Start Market Making
</button>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Common Issues</h3>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <h4 className="font-medium">Widget doesn't appear</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                      <li>Check that the script tag is correctly placed</li>
                      <li>Verify your partner ID is valid</li>
                      <li>Check browser console for JavaScript errors</li>
                      <li>Ensure CSP allows the widget domain</li>
                    </ul>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-medium">Events not firing</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                      <li>
                        Ensure event listeners are registered after SDK loads
                      </li>
                      <li>
                        Check that the widget is ready with{' '}
                        <code>ValmiraTokenBoost.isReady()</code>
                      </li>
                      <li>Verify origin validation settings</li>
                    </ul>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-medium">Styling issues</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                      <li>Check z-index conflicts with your site's CSS</li>
                      <li>Verify theme and color settings</li>
                      <li>Test in different browsers and devices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Debug Mode</h3>
                <p className="text-muted-foreground mb-2">
                  On localhost, debug information is available:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                  {`// Check debug info (localhost only)
console.log(window.ValmiraTokenBoostDebug);

// Check widget state
console.log('Is Open:', ValmiraTokenBoost.isOpen());
console.log('Is Ready:', ValmiraTokenBoost.isReady());
console.log('Config:', ValmiraTokenBoost.getConfig());`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-muted-foreground">
                  If you're still experiencing issues, contact our support team
                  with:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                  <li>Your partner ID</li>
                  <li>Browser console errors</li>
                  <li>Steps to reproduce the issue</li>
                  <li>Your website URL (if public)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center space-y-4">
        <div className="flex justify-center gap-4">
          <Button asChild variant="default">
            <a
              href="/embed/tokenboost/examples"
              className="inline-flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              View Examples
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="/embed/tokenboost/test"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Try Live Demo
            </a>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Need help? Contact us at{' '}
          <a
            href="mailto:partners@valmira.xyz"
            className="text-primary hover:underline"
          >
            partners@valmira.xyz
          </a>
        </p>
      </div>
    </div>
  );
}
