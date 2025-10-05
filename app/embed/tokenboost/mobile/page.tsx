'use client';

import { useState } from 'react';

import { Monitor, Smartphone, Tablet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  category: 'mobile' | 'tablet' | 'desktop';
}

export default function TokenBoostMobilePage() {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset | null>(
    null
  );
  const [customSize, setCustomSize] = useState({ width: 375, height: 667 });

  const devicePresets: DevicePreset[] = [
    // Mobile Devices
    {
      name: 'iPhone SE',
      width: 375,
      height: 667,
      icon: <Smartphone className="h-4 w-4" />,
      category: 'mobile',
    },
    {
      name: 'iPhone 12/13',
      width: 390,
      height: 844,
      icon: <Smartphone className="h-4 w-4" />,
      category: 'mobile',
    },
    {
      name: 'iPhone 14 Pro Max',
      width: 430,
      height: 932,
      icon: <Smartphone className="h-4 w-4" />,
      category: 'mobile',
    },
    {
      name: 'Samsung Galaxy S21',
      width: 384,
      height: 854,
      icon: <Smartphone className="h-4 w-4" />,
      category: 'mobile',
    },
    {
      name: 'Google Pixel 5',
      width: 393,
      height: 851,
      icon: <Smartphone className="h-4 w-4" />,
      category: 'mobile',
    },

    // Tablets
    {
      name: 'iPad Mini',
      width: 768,
      height: 1024,
      icon: <Tablet className="h-4 w-4" />,
      category: 'tablet',
    },
    {
      name: 'iPad Air',
      width: 820,
      height: 1180,
      icon: <Tablet className="h-4 w-4" />,
      category: 'tablet',
    },
    {
      name: 'iPad Pro 11"',
      width: 834,
      height: 1194,
      icon: <Tablet className="h-4 w-4" />,
      category: 'tablet',
    },
    {
      name: 'Samsung Galaxy Tab',
      width: 800,
      height: 1280,
      icon: <Tablet className="h-4 w-4" />,
      category: 'tablet',
    },

    // Desktop
    {
      name: 'Desktop Small',
      width: 1024,
      height: 768,
      icon: <Monitor className="h-4 w-4" />,
      category: 'desktop',
    },
    {
      name: 'Desktop Medium',
      width: 1366,
      height: 768,
      icon: <Monitor className="h-4 w-4" />,
      category: 'desktop',
    },
    {
      name: 'Desktop Large',
      width: 1920,
      height: 1080,
      icon: <Monitor className="h-4 w-4" />,
      category: 'desktop',
    },
  ];

  const generateWidgetUrl = (width: number, height: number) => {
    const params = new URLSearchParams({
      'data-partner-id': 'MOBILE_TEST',
      'data-theme': 'light',
      'data-primary-color': '#3b82f6',
      'viewport-width': width.toString(),
      'viewport-height': height.toString(),
    });
    return `/embed/tokenboost?${params.toString()}`;
  };

  const testResponsiveness = (device: DevicePreset) => {
    setSelectedDevice(device);
  };

  const testCustomSize = () => {
    const customDevice: DevicePreset = {
      name: `Custom ${customSize.width}x${customSize.height}`,
      width: customSize.width,
      height: customSize.height,
      icon: <Monitor className="h-4 w-4" />,
      category: 'desktop',
    };
    setSelectedDevice(customDevice);
  };

  const ResponsivePreview = ({ device }: { device: DevicePreset }) => {
    const scale = Math.min(
      (window.innerWidth - 100) / device.width,
      (window.innerHeight - 300) / device.height,
      1
    );

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h3 className="font-semibold">{device.name}</h3>
          <p className="text-sm text-muted-foreground">
            {device.width} × {device.height} px
            {scale < 1 && ` (scaled to ${Math.round(scale * 100)}%)`}
          </p>
        </div>

        <div
          className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white"
          style={{
            width: device.width * scale,
            height: device.height * scale,
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top center',
          }}
        >
          <iframe
            src={generateWidgetUrl(device.width, device.height)}
            width={device.width}
            height={device.height}
            frameBorder="0"
            title={`Widget preview on ${device.name}`}
            className="w-full h-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">Viewport</div>
            <div className="text-muted-foreground">
              {device.width} × {device.height}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium">Category</div>
            <div className="text-muted-foreground capitalize">
              {device.category}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResponsiveTestChecklist = () => {
    const checklistItems = [
      { item: 'Widget loads without horizontal scrolling', category: 'Layout' },
      {
        item: 'All buttons are easily tappable (44px minimum)',
        category: 'Touch Targets',
      },
      { item: 'Text is readable without zooming', category: 'Typography' },
      { item: 'Modal fits within viewport', category: 'Layout' },
      { item: 'Form inputs are accessible', category: 'Forms' },
      { item: 'Navigation is thumb-friendly', category: 'Navigation' },
      { item: 'Loading states are visible', category: 'Feedback' },
      { item: 'Error messages are clear', category: 'Feedback' },
      { item: 'Animations perform smoothly', category: 'Performance' },
      { item: 'Widget works in landscape mode', category: 'Orientation' },
    ];

    const categories = [
      ...new Set(checklistItems.map((item) => item.category)),
    ];

    return (
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="font-semibold mb-2">{category}</h4>
            <div className="space-y-2">
              {checklistItems
                .filter((item) => item.category === category)
                .map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{item.item}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TokenBoost Mobile Testing</h1>
        <p className="text-muted-foreground">
          Test widget responsiveness across different devices and screen sizes
        </p>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Device Testing</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="checklist">Test Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          {/* Device Categories */}
          {['mobile', 'tablet', 'desktop'].map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  {category === 'mobile' && <Smartphone className="h-5 w-5" />}
                  {category === 'tablet' && <Tablet className="h-5 w-5" />}
                  {category === 'desktop' && <Monitor className="h-5 w-5" />}
                  {category} Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {devicePresets
                    .filter((device) => device.category === category)
                    .map((device) => (
                      <Button
                        key={device.name}
                        variant={
                          selectedDevice?.name === device.name
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => testResponsiveness(device)}
                        className="flex flex-col items-center gap-2 h-auto p-4"
                      >
                        {device.icon}
                        <div className="text-center">
                          <div className="font-medium text-sm">
                            {device.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {device.width} × {device.height}
                          </div>
                        </div>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Custom Size Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Size Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Width:</label>
                  <input
                    type="number"
                    value={customSize.width}
                    onChange={(e) =>
                      setCustomSize((prev) => ({
                        ...prev,
                        width: parseInt(e.target.value) || 375,
                      }))
                    }
                    className="w-20 px-2 py-1 border rounded"
                    min="320"
                    max="2560"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Height:</label>
                  <input
                    type="number"
                    value={customSize.height}
                    onChange={(e) =>
                      setCustomSize((prev) => ({
                        ...prev,
                        height: parseInt(e.target.value) || 667,
                      }))
                    }
                    className="w-20 px-2 py-1 border rounded"
                    min="480"
                    max="1440"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
                <Button onClick={testCustomSize}>Test Custom Size</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Test the widget at custom dimensions. Minimum recommended:
                320×480px
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {selectedDevice ? (
            <ResponsivePreview device={selectedDevice} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Device Selected
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Select a device from the "Device Testing" tab to see the
                  widget preview
                </p>
                <Button onClick={() => testResponsiveness(devicePresets[0])}>
                  Test iPhone SE
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Responsiveness Checklist</CardTitle>
              <p className="text-muted-foreground">
                Use this checklist to ensure the widget works well across all
                devices
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveTestChecklist />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Touch Targets</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure all interactive elements are at least 44×44px for
                    easy tapping on mobile devices.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    Viewport Considerations
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Test both portrait and landscape orientations. The widget
                    should adapt gracefully to different aspect ratios.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance on Mobile</h4>
                  <p className="text-sm text-muted-foreground">
                    Mobile devices have limited processing power and memory.
                    Ensure animations are smooth and loading times are
                    acceptable.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Network Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    Test on slower network connections (3G, slow WiFi) to ensure
                    the widget loads and functions properly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
