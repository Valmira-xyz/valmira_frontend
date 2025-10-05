'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TokenBoostTestPage() {
  const [dataPartnerId, setDataPartnerId] = useState('demo123');
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [showWidget, setShowWidget] = useState(false);
  const [useSDK, setUseSDK] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const generateWidgetUrl = () => {
    const baseUrl = `${window.location.origin}/embed/tokenboost`;
    const params = new URLSearchParams({
      'data-partner-id': dataPartnerId,
      'data-theme': theme,
      'data-primary-color': primaryColor,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  // Load SDK dynamically
  const loadSDK = () => {
    if (document.getElementById('tokenboost-sdk')) return;

    const script = document.createElement('script');
    script.id = 'tokenboost-sdk';
    script.src = '/tokenboost.js';
    script.setAttribute('data-partner-id', dataPartnerId);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-primary-color', primaryColor);
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-base-url', window.location.origin);

    script.onload = () => {
      setSdkLoaded(true);
      addEvent('SDK loaded successfully');

      // Set up event listeners
      if (window.ValmiraTokenBoost) {
        window.ValmiraTokenBoost.on('widget-ready', (data) => {
          addEvent(`Widget ready: ${JSON.stringify(data)}`);
        });

        window.ValmiraTokenBoost.on('widget-opened', (data) => {
          addEvent(`Widget opened: ${JSON.stringify(data)}`);
        });

        window.ValmiraTokenBoost.on('widget-closed', (data) => {
          addEvent(`Widget closed: ${JSON.stringify(data)}`);
        });

        window.ValmiraTokenBoost.on('strategy-deployed', (data) => {
          addEvent(`Strategy deployed: ${JSON.stringify(data)}`);
        });

        window.ValmiraTokenBoost.on('widget-error', (data) => {
          addEvent(`Widget error: ${JSON.stringify(data)}`);
        });
      }
    };

    script.onerror = () => {
      addEvent('Failed to load SDK');
    };

    document.head.appendChild(script);
  };

  const addEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const sendTokenDetection = () => {
    if (useSDK && window.ValmiraTokenBoost) {
      // Use SDK API
      window.ValmiraTokenBoost.setTokens([
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 18,
        },
      ]);
      addEvent('Tokens sent via SDK');
    } else {
      // Direct iframe communication
      const iframe = document.getElementById(
        'tokenboost-iframe'
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'tokenDetection',
            tokens: [
              {
                address: '0x1234567890abcdef1234567890abcdef12345678',
                name: 'Test Token',
                symbol: 'TEST',
                decimals: 18,
              },
            ],
          },
          '*'
        );
        addEvent('Tokens sent via postMessage');
      }
    }
  };

  const openWidget = () => {
    if (useSDK && window.ValmiraTokenBoost) {
      window.ValmiraTokenBoost.open();
    }
  };

  const closeWidget = () => {
    if (useSDK && window.ValmiraTokenBoost) {
      window.ValmiraTokenBoost.close();
    }
  };

  // Effect to handle SDK mode changes
  useEffect(() => {
    if (useSDK && !sdkLoaded) {
      loadSDK();
    } else if (!useSDK && sdkLoaded) {
      if (window.ValmiraTokenBoost) {
        window.ValmiraTokenBoost.cleanup();
        setSdkLoaded(false);
        addEvent('SDK cleaned up');
      }
    }
  }, [useSDK]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">TokenBoost Widget Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="data-partner-id">Partner ID</Label>
            <Input
              id="data-partner-id"
              value={dataPartnerId}
              onChange={(e) => setDataPartnerId(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              className="w-full p-2 border rounded"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              <input
                type="checkbox"
                checked={useSDK}
                onChange={(e) => setUseSDK(e.target.checked)}
                className="mr-2"
              />
              Use SDK Mode
            </Label>
            {useSDK && (
              <Badge variant={sdkLoaded ? 'default' : 'secondary'}>
                SDK: {sdkLoaded ? 'Loaded' : 'Loading...'}
              </Badge>
            )}
          </div>

          {useSDK ? (
            <div className="space-y-2">
              <Button onClick={openWidget} disabled={!sdkLoaded}>
                Open Widget (SDK)
              </Button>
              <Button onClick={closeWidget} disabled={!sdkLoaded}>
                Close Widget (SDK)
              </Button>
              <Button onClick={sendTokenDetection} disabled={!sdkLoaded}>
                Send Token Detection (SDK)
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button onClick={() => setShowWidget(!showWidget)}>
                {showWidget ? 'Hide Widget' : 'Show Widget'} (Direct)
              </Button>
              {showWidget && (
                <Button onClick={sendTokenDetection}>
                  Send Token Detection (Direct)
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {showWidget && !useSDK ? (
                <div className="relative w-full h-[400px] border rounded">
                  <iframe
                    id="tokenboost-iframe"
                    src={generateWidgetUrl()}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                  />
                </div>
              ) : useSDK ? (
                <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-gray-500">
                    SDK Mode: Widget will appear as floating button on page
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-gray-500">
                    Widget hidden. Enable widget to preview.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm font-mono">
                {events.length === 0 ? (
                  <p className="text-gray-500">No events yet...</p>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="mb-1">
                      {event}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
        <h2 className="text-lg font-medium mb-2">Integration Code</h2>
        <pre className="bg-black text-white p-4 rounded overflow-x-auto">
          {`<script src="${window.location.origin}/tokenboost.js"
  data-partner-id="${dataPartnerId}"
  data-theme="${theme}"
  data-primary-color="${primaryColor}">
</script>`}
        </pre>
      </div>

      <div className="mt-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Learn More</h2>
        <div className="flex justify-center gap-4">
          <Button asChild variant="default">
            <a href="/embed/tokenboost/examples">View Integration Examples</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/embed/tokenboost/docs">Read Documentation</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
