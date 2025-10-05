'use client';

import { useEffect, useRef, useState } from 'react';

// import { Copy, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Switch } from '@/components/ui/switch';
// import { toast } from '@/components/ui/use-toast';
import { MultiStepDialogAmbassador } from '../ambassador/ambassador-widget-config-multistep-dialogbox';

export default function WidgetPreviewPage() {
  // type TabValue = "launchpad" | "dex" | "portfolio";

  const [dataPartnerId, _setDataPartnerId] = useState('demo123');
  const [theme, _setTheme] = useState('light');
  const [primaryColor, _setPrimaryColor] = useState('#3b82f6');
  const [position, _setPosition] = useState('bottom-right');
  const [triggerText, _setTriggerText] = useState('Boost Your Token');
  const [autoDetect, _setAutoDetect] = useState(true);
  const [previewSite, _setPreviewSite] = useState('launchpad');
  const [showModal, setShowModal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [widgetStatus, setWidgetStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const [_lastEvent, setLastEvent] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Generate the preview URL with new parameter format
  const generatePreviewUrl = () => {
    const params = new URLSearchParams({
      'data-partner-id': dataPartnerId,
      'data-theme': theme,
      'data-primary-color': encodeURIComponent(primaryColor),
      'data-position': position,
      'data-trigger-text': encodeURIComponent(triggerText),
      'data-auto-detect': autoDetect.toString(),
      'data-host': getHostForPreviewSite(),
    });

    return `/embed/tokenboost?${params.toString()}`;
  };

  const getHostForPreviewSite = () => {
    switch (previewSite) {
      case 'launchpad':
        return 'tokenlaunch.io';
      case 'dex':
        return 'swapmaster.exchange';
      case 'portfolio':
        return 'cryptotracker.pro';
      default:
        return 'example.com';
    }
  };

  // Handle click outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // Send token detection message to iframe when it loads
  useEffect(() => {
    if (showModal && iframeRef.current) {
      // Give the iframe time to load
      const timer = setTimeout(() => {
        const mockTokens = [
          {
            address: '0x1234567890123456789012345678901234567890',
            name: 'Awesome Token',
            symbol: 'AWE',
            decimals: 18,
          },
        ];

        iframeRef?.current?.contentWindow?.postMessage(
          {
            type: 'tokenDetection',
            tokens: mockTokens,
          },
          '*'
        );
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Enhanced event handling for new widget events
  useEffect(() => {
    const handleWidgetMessage = (event: MessageEvent) => {
      // In production, add origin validation
      // if (event.origin !== window.location.origin) return;

      const { type, ...data } = event.data || {};

      switch (type) {
        case 'valmira-widget-ready':
          setWidgetStatus('ready');
          setLastEvent(`Widget ready: Partner ${data['data-partner-id']}`);
          console.log('Widget ready:', data);
          break;

        case 'valmira-widget-closed':
        case 'valmira-widget-close':
          setShowModal(false);
          setLastEvent('Widget closed by user');
          console.log('Widget closed:', data);
          break;

        case 'valmira-strategy-deployed':
          setLastEvent(
            `Strategy deployed: ${data.strategy?.type || 'Unknown'}`
          );
          console.log('Strategy deployed:', data);
          // Could show success notification here
          break;

        case 'valmira-widget-error':
          setWidgetStatus('error');
          setLastEvent(
            `Widget error: ${data.error?.message || 'Unknown error'}`
          );
          console.error('Widget error:', data);
          break;

        case 'valmira-sdk-ready':
          setLastEvent('SDK initialized successfully');
          console.log('SDK ready:', data);
          break;

        default:
          if (type && type.startsWith('valmira-')) {
            setLastEvent(`Event: ${type}`);
            console.log('Widget event:', type, data);
          }
      }
    };

    window.addEventListener('message', handleWidgetMessage);
    return () => window.removeEventListener('message', handleWidgetMessage);
  }, []);

  return (
    <div className="container m-auto p-6 ">
      <div className="">
        <div className="w-full">
          <Card className="h-fit w-full ">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex justify-between items-center ">
                    <div className="font-tt font-semibold">Live Preview </div>
                  </CardTitle>
                  <CardDescription>
                    See how the widget will appear on different websites
                  </CardDescription>
                  {/* {lastEvent && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Last event: {lastEvent}
                    </div>
                  )} */}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      widgetStatus === 'ready'
                        ? 'bg-green-500'
                        : widgetStatus === 'error'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {widgetStatus}
                  </span>
                  {/* <Button
                    className="ml-2 w-fit"
                    onClick={() => setDialogOpen(true)}
                  >
                    Boost Your Token
                  </Button> */}
                </div>
                <MultiStepDialogAmbassador
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  onDeploy={() => {}}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[600px] relative">
              <iframe
                ref={iframeRef}
                src={generatePreviewUrl()}
                className="w-full h-full border-t"
                title="TokenBoost Widget Preview"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal for widget */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            ref={modalRef}
            className="relative w-[90%] max-w-[600px] h-[80%] max-h-[700px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowModal(false)}
            >
              {/* <X className="h-4 w-4" /> */}
            </Button>
            <iframe
              ref={iframeRef}
              src={generatePreviewUrl()}
              className="w-full h-full border-0"
              title="TokenBoost Widget"
            />
          </div>
        </div>
      )}
    </div>
  );
}
