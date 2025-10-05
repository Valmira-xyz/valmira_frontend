'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  BarChart3,
  Code,
  Copy,
  ExternalLink,
  Play,
  TrendingUp,
  Upload,
} from 'lucide-react';
// import { DollarSign, MousePointer, Users } from 'lucide-react';
import NumberFlow from '@number-flow/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { widgetService } from '@/services/widgetService';
import type { RootState } from '@/store/store';

// import { MultiStepDialogAmbassador } from '../ambassador/ambassador-widget-config-multistep-dialogbox';

const initialMetrics = [
  {
    title: 'Widget Deployments',
    value: 0,
    icon: TrendingUp,
    subtitle: 'Loading...',
    isCurrency: false,
  },
  {
    title: 'Conversion Rate',
    value: 0,
    icon: BarChart3,
    subtitle: 'Loading...',
    isCurrency: false,
  },
  {
    title: 'Widget Commissions',
    value: 0,
    icon: Upload,
    subtitle: 'Loading...',
    isCurrency: true,
  },
];

export function WidgetIntegration() {
  const [widgetTheme, setWidgetTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [integrationType, setIntegrationType] = useState('iframe'); // 'iframe' or 'floating'
  const [triggerText, setTriggerText] = useState('Boost Your Token');
  const [autoDetect, setAutoDetect] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [embedTab, setEmbedTab] = useState('basic');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [animatedMetrics, setAnimatedMetrics] = useState(
    initialMetrics.map((m) => ({ ...m, value: 0 }))
  );
  // const [dialogOpen, setDialogOpen] = useState(false);
  const [_isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [_commissionData, setCommissionData] = useState<{
    weeklyEarnings: number;
    monthlyEarnings: number;
    dailyAvgEarnings: number;
    topReferralToken: {
      symbol: string;
      earnings: number;
      transactionCount: number;
      lastTransaction: Date;
    } | null;
  }>({
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    dailyAvgEarnings: 0,
    topReferralToken: null,
  });
  const [_commissionError, setCommissionError] = useState<string | null>(null);
  const [_isLoadingCommissions, setIsLoadingCommissions] = useState(false);

  // Get real ambassador ID from authenticated user
  const { user } = useSelector((state: RootState) => state.auth);
  const ambassadorId = user?._id || 'amb_1234567890'; // Fallback to mock ID if user not authenticated

  // Helper function to calculate trend
  const calculateTrend = (
    current: number,
    previous: number,
    period: string = 'last month'
  ) => {
    if (!previous || previous === 0) return `+${current} from ${period}`;

    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);
    const sign = diff >= 0 ? '+' : '';

    if (current === 0 && previous === 0) return `No change from ${period}`;

    return `${sign}${diff} (${sign}${percentage}%) from ${period}`;
  };

  // Fetch real widget metrics
  useEffect(() => {
    const fetchRealMetrics = async () => {
      try {
        setIsLoadingMetrics(true);
        setIsLoadingCommissions(true);
        setCommissionError(null);

        // Fetch current period (30 days) and previous period (60 days) for comparison
        const [currentResponse, previousResponse] = await Promise.all([
          widgetService.getPerformanceMetrics(ambassadorId, '30d'),
          widgetService.getPerformanceMetrics(ambassadorId, '60d'),
        ]);

        if (currentResponse.success && currentResponse.data) {
          const currentData = currentResponse.data;
          const previousData = previousResponse.success
            ? previousResponse.data
            : {};

          // Calculate metrics from real data
          const deployments = currentData.metrics?.totalSessions || 0;
          const conversions = currentData.metrics?.conversions || 0;
          const conversionRate =
            deployments > 0
              ? parseFloat(((conversions / deployments) * 100).toFixed(1))
              : 0;
          const commissions = currentData.metrics?.totalCommissions || 0;

          // Extract commission data with error handling
          try {
            setCommissionData({
              weeklyEarnings: currentData.metrics?.weeklyEarnings || 0,
              monthlyEarnings: currentData.metrics?.monthlyEarnings || 0,
              dailyAvgEarnings: currentData.metrics?.dailyAvgEarnings || 0,
              topReferralToken: currentData.metrics?.topReferralToken,
            });
            setCommissionError(null);
          } catch (commissionErr) {
            console.error('Error processing commission data:', commissionErr);
            setCommissionError('Failed to load commission data');
            // Keep default values in commissionData
          }

          // Calculate trends
          const deploymentTrend = calculateTrend(
            deployments,
            previousData.totalSessions
          );
          const conversionTrend = calculateTrend(
            conversionRate,
            previousData.conversionRate,
            'last period'
          );
          const commissionTrend = calculateTrend(
            commissions,
            previousData.totalCommissions
          );

          const realMetrics = [
            {
              title: 'Widget Deployments',
              value: deployments,
              icon: TrendingUp,
              subtitle: deploymentTrend,
              isCurrency: false,
            },
            {
              title: 'Conversion Rate',
              value: conversionRate,
              icon: BarChart3,
              subtitle: conversionTrend,
              isCurrency: false,
            },
            {
              title: 'Widget Commissions',
              value: commissions,
              icon: Upload,
              subtitle: commissionTrend,
              isCurrency: true,
            },
          ];

          setMetrics(realMetrics);
        } else {
          // Fallback to demo data if API fails
          console.warn('Failed to fetch widget metrics, using demo data');
          setCommissionError(
            'Unable to load real-time data. Showing demo values.'
          );
          setMetrics([
            {
              ...initialMetrics[0],
              value: 24,
              subtitle: '+8 from last month (demo)',
            },
            {
              ...initialMetrics[1],
              value: 12.3,
              subtitle: '+12% from yesterday (demo)',
            },
            {
              ...initialMetrics[2],
              value: 342.5,
              subtitle: '+$120.75 from last month (demo)',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching widget metrics:', error);
        setCommissionError(
          'Failed to connect to analytics service. Please try again later.'
        );

        // Show error toast
        toast({
          title: 'Analytics Error',
          description:
            'Unable to load widget analytics. Please check your connection and try again.',
          variant: 'destructive',
        });

        // Use demo data on error
        setMetrics([
          {
            ...initialMetrics[0],
            value: 24,
            subtitle: '+8 from last month (demo)',
          },
          {
            ...initialMetrics[1],
            value: 12.3,
            subtitle: '+12% from yesterday (demo)',
          },
          {
            ...initialMetrics[2],
            value: 342.5,
            subtitle: '+$120.75 from last month (demo)',
          },
        ]);
      } finally {
        setIsLoadingMetrics(false);
        setIsLoadingCommissions(false);
      }
    };

    fetchRealMetrics();

    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchRealMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ambassadorId]);

  // Animate metrics when they change
  useEffect(() => {
    // Start with zero
    setAnimatedMetrics(metrics.map((m) => ({ ...m, value: 0 })));

    // Animate to actual values after a short delay
    const timer = setTimeout(() => {
      setAnimatedMetrics(metrics);
    }, 100);

    return () => clearTimeout(timer);
  }, [metrics]);

  // Generate embed code based on current settings

  const generateEmbedCode = () => {
    // Build widget URL like partner demo site
    const params = new URLSearchParams();

    if (ambassadorId) {
      params.set('data-partner-id', ambassadorId);
    }

    params.set('data-theme', widgetTheme);

    if (primaryColor) {
      params.set('data-primary-color', encodeURIComponent(primaryColor));
    }

    const widgetUrl = `https://valmira.xyz/embed/tokenboost?${params.toString()}`;

    if (integrationType === 'iframe') {
      // Direct iframe integration
      return `<!-- TokenBoost Widget - Direct Iframe Integration -->
<div class="tokenboost-widget-container">
  <iframe
    id="tokenboostIframe"
    src="${widgetUrl}"
    width="400"
    height="600"
    frameborder="0"
    allow="clipboard-write; web-share"
    title="TokenBoost Widget"
    loading="lazy"
    style="border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  >
  </iframe>
</div>

<!-- Optional: Add custom styling -->
<style>
  .tokenboost-widget-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .tokenboost-widget-container iframe {
      width: 100%;
      height: 500px;
    }
  }
</style>

<script>
// Token detection for your platform
const detectTokens = () => {
  // Replace this with your actual token detection logic
  const detectedTokens = [
    {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'TOKEN',
      name: 'Your Token',
      decimals: 18,
      network: 'ethereum'
    }
  ];
  return detectedTokens;
};

// Send detected tokens to widget
const iframe = document.getElementById('tokenboostIframe');
iframe.onload = function() {
  setTimeout(() => {
    const tokens = detectTokens();
    if (tokens.length > 0) {
      iframe.contentWindow.postMessage({
        type: 'tokenDetection',
        tokens: tokens
      }, '*');
      console.log('Tokens sent to widget:', tokens);
    }
  }, 1000);
};

// Listen for widget events
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://valmira.xyz') return;

  switch(event.data.type) {
    case 'widget_ready':
      console.log('Widget is ready');
      break;
    case 'strategy_deployed':
      console.log('Strategy deployed:', event.data.payload);
      // Handle successful deployment
      break;
    case 'widget_resize':
      console.log('Widget resize requested:', event.data.payload);
      break;
  }
});
</script>`;
    } else {
      // Floating chat-like widget integration
      return `<!-- TokenBoost Widget - Floating Chat Integration -->
<div class="tokenboost-widget">
  <button class="widget-trigger" id="widgetTrigger" onclick="toggleWidget()">
    💎
  </button>
</div>

<!-- Widget Panel -->
<div class="widget-panel" id="widgetPanel">
  <div class="widget-header">
    <h3>TokenBoost</h3>
    <button class="close-btn" onclick="closeWidget()">&times;</button>
  </div>
  <div class="widget-content">
    <iframe
      id="tokenboostIframe"
      class="widget-iframe"
      src=""
      title="TokenBoost Widget"
      allow="clipboard-write; web-share"
      loading="lazy">
    </iframe>
  </div>
</div>

<!-- Overlay -->
<div class="overlay" id="overlay" onclick="closeWidget()"></div>

<style>
  .tokenboost-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
  }

  .widget-trigger {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${widgetTheme === 'dark' ? '#1f2937' : '#ffffff'};
    color: ${widgetTheme === 'dark' ? '#ffffff' : '#333333'};
    border: 2px solid ${primaryColor};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .widget-trigger:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .widget-trigger.active {
    background: ${primaryColor};
    color: white;
  }

  .widget-panel {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    max-width: 90vw;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 999;
    display: none;
    flex-direction: column;
    overflow: hidden;
    transform: scale(0.9);
    opacity: 0;
    transition: all 0.3s ease;
  }

  .widget-panel.open {
    display: flex;
    transform: scale(1);
    opacity: 1;
  }

  .widget-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f9fafb;
  }

  .widget-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .widget-content {
    flex: 1;
    overflow: hidden;
  }

  .widget-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .overlay.active {
    opacity: 1;
    visibility: visible;
  }

  @media (max-width: 768px) {
    .widget-panel {
      width: 95vw;
      height: 85vh;
      bottom: 10px;
      right: 10px;
      left: 10px;
    }
  }
</style>

<script>
// Widget Configuration
const WIDGET_CONFIG = {
  baseUrl: 'https://valmira.xyz/embed/tokenboost',
  partnerId: '${ambassadorId}',
  theme: '${widgetTheme}',
  primaryColor: '${primaryColor}',
  autoDetect: ${autoDetect},
  autoOpen: ${autoOpen}
};

// Build widget URL with parameters
function buildWidgetUrl() {
  const params = new URLSearchParams();

  if (WIDGET_CONFIG.partnerId) {
    params.set('data-partner-id', WIDGET_CONFIG.partnerId);
  }

  params.set('data-theme', WIDGET_CONFIG.theme);

  if (WIDGET_CONFIG.primaryColor) {
    params.set('data-primary-color', encodeURIComponent(WIDGET_CONFIG.primaryColor));
  }

  return \`\${WIDGET_CONFIG.baseUrl}?\${params.toString()}\`;
}

// Token detection for your platform
const detectTokens = () => {
  // Replace this with your actual token detection logic
  const detectedTokens = [
    {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'TOKEN',
      name: 'Your Token',
      decimals: 18,
      network: 'ethereum'
    }
  ];
  return detectedTokens;
};

// Widget controls
function toggleWidget() {
  const panel = document.getElementById('widgetPanel');
  const overlay = document.getElementById('overlay');
  const trigger = document.getElementById('widgetTrigger');

  const isOpen = panel.classList.contains('open');

  if (isOpen) {
    closeWidget();
  } else {
    openWidget();
  }
}

function openWidget() {
  const panel = document.getElementById('widgetPanel');
  const overlay = document.getElementById('overlay');
  const trigger = document.getElementById('widgetTrigger');

  panel.classList.add('open');
  overlay.classList.add('active');
  trigger.classList.add('active');
  trigger.innerHTML = '✕';

  // Send tokens when widget opens
  const iframe = document.getElementById('tokenboostIframe');
  if (iframe && iframe.contentWindow) {
    const detectedTokens = detectTokens();
    setTimeout(() => {
      iframe.contentWindow.postMessage({
        type: 'tokenDetection',
        tokens: detectedTokens
      }, '*');
      console.log('Tokens sent on widget open:', detectedTokens);
    }, 500);
  }
}

function closeWidget() {
  const panel = document.getElementById('widgetPanel');
  const overlay = document.getElementById('overlay');
  const trigger = document.getElementById('widgetTrigger');

  panel.classList.remove('open');
  overlay.classList.remove('active');
  trigger.classList.remove('active');
  trigger.innerHTML = '💎';
}

// Initialize widget when page loads
document.addEventListener('DOMContentLoaded', function() {
  const iframe = document.getElementById('tokenboostIframe');
  const widgetUrl = buildWidgetUrl();

  iframe.src = widgetUrl;

  // Send tokens to widget when iframe loads
  iframe.onload = function() {
    setTimeout(() => {
      const detectedTokens = detectTokens();
      if (detectedTokens.length > 0) {
        iframe.contentWindow.postMessage({
          type: 'tokenDetection',
          tokens: detectedTokens
        }, '*');
        console.log('Tokens sent to widget via postMessage:', detectedTokens);
      }
    }, 1000);
  };
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeWidget();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'W') {
    toggleWidget();
  }
});

// Message handling from iframe
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://valmira.xyz') return;

  const data = event.data;

  switch (data.type) {
    case 'widget_ready':
      console.log('Widget is ready');
      break;

    case 'strategy_deployed':
      console.log('Strategy deployed:', data.payload);
      alert('🎉 Strategy deployed successfully!');
      break;

    case 'widget_resize':
      console.log('Widget resize requested:', data.payload);
      break;

    case 'widget_close':
      closeWidget();
      break;

    default:
      console.log('Unknown message from widget:', data);
  }
});
</script>`;
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The embed code has been copied to your clipboard.',
    });
  };

  // Generate advanced integration code
  const generateAdvancedCode = () => {
    return `// Advanced TokenBoost Widget Integration with Dynamic Token Detection

// Configuration
const WIDGET_CONFIG = {
  baseUrl: 'https://valmira.xyz/embed/tokenboost',
  partnerId: '${ambassadorId}',
  theme: '${widgetTheme}',
  primaryColor: '${primaryColor}',
  autoDetect: ${autoDetect},
  autoOpen: ${autoOpen}
};

// Dynamic token detection based on your platform
function detectTokens() {
  const detectedTokens = [];
  const pageContent = document.body.innerText.toLowerCase();

  // Example: Detect tokens mentioned in page content
  const knownTokens = [
    {
      address: '0xA0b86a33E6441b8e776f89d2d1a6476c7e3c8b8c',
      symbol: 'PEPE',
      name: 'Pepe Token',
      decimals: 18,
      network: 'ethereum'
    },
    {
      address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      symbol: 'SHIB',
      name: 'Shiba Inu',
      decimals: 18,
      network: 'ethereum'
    }
  ];

  knownTokens.forEach(token => {
    if (pageContent.includes(token.symbol.toLowerCase()) ||
        pageContent.includes(token.name.toLowerCase())) {
      detectedTokens.push(token);
    }
  });

  return detectedTokens.length > 0 ? detectedTokens : [];
}

// Build widget URL with parameters
function buildWidgetUrl() {
  const params = new URLSearchParams();

  if (WIDGET_CONFIG.partnerId) {
    params.set('data-partner-id', WIDGET_CONFIG.partnerId);
  }

  params.set('data-theme', WIDGET_CONFIG.theme);

  if (WIDGET_CONFIG.primaryColor) {
    params.set('data-primary-color', encodeURIComponent(WIDGET_CONFIG.primaryColor));
  }

  return \`\${WIDGET_CONFIG.baseUrl}?\${params.toString()}\`;
}

// Initialize widget with token detection
function initWidget() {
  const iframe = document.getElementById('tokenboostIframe');
  const widgetUrl = buildWidgetUrl();

  iframe.src = widgetUrl;

  // Display detected tokens
  const detectedTokens = detectTokens();
  updateTokenDisplay(detectedTokens);

  // Send tokens to widget when iframe loads
  iframe.onload = function() {
    setTimeout(() => {
      if (detectedTokens.length > 0) {
        iframe.contentWindow.postMessage({
          type: 'tokenDetection',
          tokens: detectedTokens
        }, '*');
        console.log('✅ Tokens sent to widget:', detectedTokens);
      }
    }, 1000);
  };

  console.log('TokenBoost Widget initialized:', {
    config: WIDGET_CONFIG,
    detectedTokens: detectedTokens,
    finalUrl: widgetUrl
  });
}

// Refresh token detection manually
function refreshTokenDetection() {
  console.log('🔄 Refreshing token detection...');
  const detectedTokens = detectTokens();
  updateTokenDisplay(detectedTokens);

  // Send tokens to widget
  const iframe = document.getElementById('tokenboostIframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'tokenDetection',
      tokens: detectedTokens
    }, '*');
    console.log('✅ Refreshed tokens sent to widget:', detectedTokens);
  }
}

// Update token detection display
function updateTokenDisplay(tokens) {
  const tokenDisplay = document.getElementById('detected-tokens');
  if (tokenDisplay) {
    if (tokens.length > 0) {
      const tokenList = tokens.map(token =>
        \`<span class="token-badge">\${token.symbol} (\${token.name})</span>\`
      ).join(' ');
      tokenDisplay.innerHTML = \`<strong>Detected Tokens:</strong> \${tokenList}\`;
    } else {
      tokenDisplay.innerHTML = '<strong>Detected Tokens:</strong> None';
    }
  }
}

// Programmatic widget control
function openTokenBoostWidget() {
  const trigger = document.getElementById('widgetTrigger');
  if (trigger && !document.getElementById('widgetPanel').classList.contains('open')) {
    trigger.click();
  }
}

function closeTokenBoostWidget() {
  const panel = document.getElementById('widgetPanel');
  if (panel && panel.classList.contains('open')) {
    closeWidget();
  }
}

// Check if widget is currently open
function isWidgetOpen() {
  const panel = document.getElementById('widgetPanel');
  return panel && panel.classList.contains('open');
}

// Analytics tracking
function trackEvent(eventName, data = {}) {
  console.log('Event tracked:', eventName, data);

  // Example: Send to your analytics service
  // analytics.track(eventName, { partnerId: WIDGET_CONFIG.partnerId, ...data });
}

// Message handling from iframe
window.addEventListener('message', function(event) {
  // Verify origin for security
  if (event.origin !== 'https://valmira.xyz') return;

  const data = event.data;

  switch (data.type) {
    case 'widget_ready':
      console.log('Widget is ready');
      trackEvent('widget_ready');
      break;

    case 'strategy_deployed':
      console.log('Strategy deployed:', data.payload);
      trackEvent('strategy_deployed', data.payload);

      // Show success notification
      alert('🎉 Strategy deployed successfully!');

      // Optional: Close widget after successful deployment
      // setTimeout(() => closeTokenBoostWidget(), 2000);
      break;

    case 'widget_resize':
      console.log('Widget resize requested:', data.payload);
      break;

    case 'widget_close':
      closeTokenBoostWidget();
      break;

    default:
      console.log('Unknown message from widget:', data);
  }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  initWidget();

  setTimeout(() => {
    console.log('🚀 TokenBoost Widget loaded successfully!');
  }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeTokenBoostWidget();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'W') {
    if (isWidgetOpen()) {
      closeTokenBoostWidget();
    } else {
      openTokenBoostWidget();
    }
  }
});`;
  };

  // Generate React integration code
  const generateReactCode = () => {
    return `import { useEffect, useRef, useState } from 'react';

const TokenBoostWidget = ({
  partnerId = '${ambassadorId}',
  theme = '${widgetTheme}',
  primaryColor = '${primaryColor}',
  autoDetect = ${autoDetect},
  autoOpen = ${autoOpen}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef(null);

  // Widget configuration
  const WIDGET_CONFIG = {
    baseUrl: 'https://valmira.xyz/embed/tokenboost',
    partnerId,
    theme,
    primaryColor,
    autoDetect,
    autoOpen
  };

  // Token detection for your platform
  const detectTokens = () => {
    // Replace this with your actual token detection logic
    const detectedTokens = [
      {
        address: '0x1234567890123456789012345678901234567890',
        symbol: 'TOKEN',
        name: 'Your Token',
        decimals: 18,
        network: 'ethereum'
      }
    ];
    return detectedTokens;
  };

  // Build widget URL with parameters
  const buildWidgetUrl = () => {
    const params = new URLSearchParams();

    if (WIDGET_CONFIG.partnerId) {
      params.set('data-partner-id', WIDGET_CONFIG.partnerId);
    }

    params.set('data-theme', WIDGET_CONFIG.theme);

    if (WIDGET_CONFIG.primaryColor) {
      params.set('data-primary-color', encodeURIComponent(WIDGET_CONFIG.primaryColor));
    }

    return \`\${WIDGET_CONFIG.baseUrl}?\${params.toString()}\`;
  };

  // Widget controls
  const openWidget = () => {
    setIsOpen(true);

    // Send tokens when widget opens
    setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const detectedTokens = detectTokens();
        iframeRef.current.contentWindow.postMessage({
          type: 'tokenDetection',
          tokens: detectedTokens
        }, '*');
        console.log('Tokens sent on widget open:', detectedTokens);
      }
    }, 500);
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  const toggleWidget = () => {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  };

  // Message handling from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://valmira.xyz') return;

      const data = event.data;

      switch (data.type) {
        case 'widget_ready':
          console.log('Widget is ready');
          break;

        case 'strategy_deployed':
          console.log('Strategy deployed:', data.payload);
          alert('🎉 Strategy deployed successfully!');
          break;

        case 'widget_resize':
          console.log('Widget resize requested:', data.payload);
          break;

        case 'widget_close':
          closeWidget();
          break;

        default:
          console.log('Unknown message from widget:', data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Initialize iframe when it loads
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;

      iframe.onload = () => {
        setTimeout(() => {
          const detectedTokens = detectTokens();
          if (detectedTokens.length > 0) {
            iframe.contentWindow.postMessage({
              type: 'tokenDetection',
              tokens: detectedTokens
            }, '*');
            console.log('Tokens sent to widget via postMessage:', detectedTokens);
          }
        }, 1000);
      };
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeWidget();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        toggleWidget();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Widget Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <button
          onClick={toggleWidget}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: isOpen ? '#ffffff' : (theme === 'dark' ? '#ffffff' : '#333333'),
            backgroundColor: isOpen ? primaryColor : (theme === 'dark' ? '#1f2937' : '#ffffff'),
            border: \`2px solid \${primaryColor}\`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {isOpen ? '✕' : '💎'}
        </button>
      </div>

      {/* Widget Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={closeWidget}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              transition: 'all 0.3s ease'
            }}
          />

          {/* Widget Panel */}
          <div
            style={{
              position: 'fixed',
              bottom: '90px',
              right: '20px',
              width: '400px',
              height: '600px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f9fafb'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827'
                }}
              >
                TokenBoost
              </h3>
              <button
                onClick={closeWidget}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '4px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            {/* Widget Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <iframe
                ref={iframeRef}
                src={buildWidgetUrl()}
                title="TokenBoost Widget"
                allow="clipboard-write; web-share"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Usage in your React app
const App = () => {
  return (
    <div>
      <h1>My Website</h1>
      <p>Your content here...</p>

      {/* TokenBoost Widget */}
      <TokenBoostWidget
        partnerId="${ambassadorId}"
        theme="${widgetTheme}"
        primaryColor="${primaryColor}"
        autoDetect={${autoDetect}}
        autoOpen={${autoOpen}}
      />
    </div>
  );
};

export default TokenBoostWidget;`;
  };

  return (
    <div className="space-y-6 ">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {animatedMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-tt">
                  <NumberFlow
                    value={metric.value}
                    locales="en-US"
                    format={
                      metric.isCurrency
                        ? {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        : {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                    }
                  />
                  {metric.title === 'Conversion Rate' && '%'}
                </div>
                <p className={`text-xs ${'text-muted-foreground'}`}>
                  {metric.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-1 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-tt">TokenBoost Widget</CardTitle>
              <CardDescription>
                Embed a market making widget on your website to earn commissions
                when users deploy strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-white-50 dark:bg-white-950 border rounded-lg">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-white-100 dark:bg-white-900 flex
  items-center justify-center"
                >
                  <Code className="h-6 w-6 text-white-600 dark:text-white-400" />
                </div>
                <div>
                  <h3 className="font-medium">Same Commission Structure</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll earn the same commissions whether users come through
                    your referral link or use the widget on your website.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 font-tt">
                  Widget Customization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="integrationType"
                        className="font-bold font-tt"
                      >
                        Integration Type
                      </Label>
                      <Select
                        value={integrationType}
                        onValueChange={setIntegrationType}
                      >
                        <SelectTrigger id="integrationType">
                          <SelectValue placeholder="Select integration type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iframe">Direct Iframe</SelectItem>
                          <SelectItem value="floating">
                            Floating Chat Widget
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme" className="font-bold font-tt">
                        Theme
                      </Label>
                      <Select
                        value={widgetTheme}
                        onValueChange={setWidgetTheme}
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">
                            Auto (match user's system)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="triggerText"
                        className="font-bold font-tt"
                      >
                        Button Text
                      </Label>
                      <Input
                        id="triggerText"
                        value={triggerText}
                        onChange={(e) => setTriggerText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="primaryColor"
                        className="font-bold font-tt"
                      >
                        Primary Color
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="primaryColor"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoDetect">Auto-detect Tokens</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically detect tokens on the page
                      </p>
                    </div>
                    <Switch
                      id="autoDetect"
                      checked={autoDetect}
                      onCheckedChange={setAutoDetect}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoOpen">Auto-open Widget</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically open widget when page loads
                      </p>
                    </div>
                    <Switch
                      id="autoOpen"
                      checked={autoOpen}
                      onCheckedChange={setAutoOpen}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="allowedOrigins"
                      className="font-bold font-tt"
                    >
                      Allowed Origins (Security)
                    </Label>
                    <Input
                      id="allowedOrigins"
                      value={allowedOrigins}
                      onChange={(e) => setAllowedOrigins(e.target.value)}
                      placeholder="https://yoursite.com,https://www.yoursite.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of allowed origins for security.
                      Leave empty to allow all origins.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-bold mb-4 font-tt">Embed Code</h3>
                <Tabs value={embedTab} onValueChange={setEmbedTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="react">React</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic">
                    <div className="relative">
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                        {generateEmbedCode()}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generateEmbedCode())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add this script to your website's HTML, ideally just
                      before the closing &lt;/body&gt; tag.
                    </p>
                  </TabsContent>
                  <TabsContent value="advanced">
                    <div className="space-y-4">
                      <div className="relative">
                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                          {generateAdvancedCode()}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(generateAdvancedCode())
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Advanced integration with event handling, programmatic
                        control, and custom styling for the floating widget.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="react">
                    <div className="relative">
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                        {generateReactCode()}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generateReactCode())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Complete React component for integrating the TokenBoost
                      floating widget.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a
                  href="/ambassador/widget-preview"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Preview Widget
                </a>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <a
                  href="/tutorials/ambassador/getting-started"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Detailed Documentation
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* <div
          className="grid grid-cols-1 sm:grid-cols-1 gap-2  lg:space-y-2 lg:gap-0 md:grid-cols-2 lg:grid-cols-1
  col-span-1 md:col-span-1 lg:col-span-1"
        > */}
        {/* <div className="col-span-1 md:mb-0 lg:mb-2 md:col-span-1 lg:col-span-2">
            <Card className="h-fit sm:h-fit lg:h-fit">
              <CardHeader>
                <CardTitle className="font-tt">Top Website</CardTitle>
                <CardDescription>
                  Track how your embedded widget is performing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {commissionError && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">{commissionError}</p>
                  </div>
                )}

                {isLoadingCommissions ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center"
                      >
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Earning</span>
                      <NumberFlow
                        className="font-tt font-bold"
                        value={commissionData.weeklyEarnings}
                        locales="en-US"
                        format={{
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Earnings</span>
                      <NumberFlow
                        className="font-tt font-bold"
                        value={commissionData.monthlyEarnings}
                        locales="en-US"
                        format={{
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Daily Earning</span>
                      <NumberFlow
                        className="font-tt font-bold"
                        value={commissionData.dailyAvgEarnings}
                        locales="en-US"
                        format={{
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Profitable Referral</span>
                      <span className="font-tt font-bold">
                        {commissionData.topReferralToken ? (
                          <>
                            {commissionData.topReferralToken.symbol}(
                            <NumberFlow
                              value={commissionData.topReferralToken.earnings}
                              locales="en-US"
                              format={{
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }}
                            />
                            )
                          </>
                        ) : (
                          'No data yet'
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/ambassador">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Detailed Analytics
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div> */}
        {/* <div className="col-span-1  md:mt-0 lg:mt-2 md:col-span-1 lg:col-span-2">
            <Card className=" h-full lg:h-full sm:fit">
              <CardHeader>
                <CardTitle className="font-tt">Implementation</CardTitle>
                <CardDescription>
                  Step-by-step guides for different platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#wordpress-guide">
                      <Download className="mr-2 h-4 w-4" />
                      WordPress Guide
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#shopify-guide">
                      <Download className="mr-2 h-4 w-4" />
                      Shopify Guide
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#wix-guide">
                      <Download className="mr-2 h-4 w-4" />
                      Wix Guide
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#custom-site-guide">
                      <Download className="mr-2 h-4 w-4" />
                      Custom Website Guide
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div> */}
        {/* <Button className="m-2 w-fit" onClick={() => setDialogOpen(true)}>
            Boost Your Token
          </Button> */}
        {/* <MultiStepDialogAmbassador
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onDeploy={()=>{}}
          /> */}
        {/* </div> */}
      </div>
    </div>
  );
}
