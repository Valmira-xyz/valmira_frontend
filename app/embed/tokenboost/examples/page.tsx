'use client';

import { useState } from 'react';

import { Code, Copy, ExternalLink, Rocket, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TokenBoostExamplesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const examples = {
    launchpad: {
      title: 'Token Launchpad Integration',
      description:
        'Perfect for token launch platforms that want to offer market making services immediately after token deployment.',
      icon: <Rocket className="h-5 w-5" />,
      useCase:
        'After a user deploys a new token, automatically suggest market making services.',
      code: {
        html: `<!-- Add to your token deployment success page -->
<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="LAUNCHPAD123"
  data-theme="dark"
  data-primary-color="#00d4aa"
  data-position="center"
  data-trigger-text="🚀 Boost Your Token">
</script>

<script>
// After successful token deployment
function onTokenDeployed(tokenData) {
  // Set the newly deployed token
  ValmiraTokenBoost.setTokens([{
    address: tokenData.address,
    name: tokenData.name,
    symbol: tokenData.symbol,
    decimals: tokenData.decimals
  }]);

  // Auto-open the widget
  ValmiraTokenBoost.open();

  // Listen for strategy deployment
  ValmiraTokenBoost.on('strategy-deployed', (data) => {
    showSuccessMessage(\`Market making started for \${data.strategy.token.symbol}!\`);

    // Track conversion for analytics
    analytics.track('market_making_deployed', {
      token: data.strategy.token.symbol,
      strategy: data.strategy.type,
      partner: 'launchpad'
    });
  });
}
</script>`,
        react: `import { useEffect } from 'react';

function TokenDeploymentSuccess({ tokenData }) {
  useEffect(() => {
    // Load TokenBoost SDK
    const script = document.createElement('script');
    script.src = 'https://valmira.xyz/tokenboost.js';
    script.setAttribute('data-partner-id', 'LAUNCHPAD123');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-primary-color', '#00d4aa');
    script.setAttribute('data-position', 'center');

    script.onload = () => {
      // Set the deployed token
      window.ValmiraTokenBoost?.setTokens([tokenData]);

      // Auto-open after 2 seconds
      setTimeout(() => {
        window.ValmiraTokenBoost?.open();
      }, 2000);

      // Listen for events
      window.ValmiraTokenBoost?.on('strategy-deployed', (data) => {
        toast.success(\`Market making started for \${data.strategy.token.symbol}!\`);
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [tokenData]);

  return (
    <div className="success-page">
      <h1>Token Deployed Successfully! 🎉</h1>
      <p>Your token {tokenData.symbol} is now live.</p>
      <p>Want to boost its trading activity? Our market making bot will help!</p>
    </div>
  );
}`,
      },
    },
    dex: {
      title: 'DEX Integration',
      description:
        'Ideal for decentralized exchanges that want to offer market making services to liquidity providers.',
      icon: <Zap className="h-5 w-5" />,
      useCase:
        'After a user adds liquidity, offer market making to optimize their returns.',
      code: {
        html: `<!-- Add to your DEX interface -->
<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="DEX456"
  data-theme="auto"
  data-primary-color="#ff6b35"
  data-position="bottom-right"
  data-trigger-text="⚡ Optimize Returns">
</script>

<script>
// After liquidity is added
function onLiquidityAdded(pairData) {
  // Extract token information
  const token = pairData.token0; // or token1 based on your logic

  ValmiraTokenBoost.setTokens([{
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals
  }]);

  // Show a subtle notification
  showNotification('💡 Maximize your LP returns with automated market making!', {
    action: () => ValmiraTokenBoost.open(),
    actionText: 'Learn More'
  });
}

// Listen for successful strategy deployment
ValmiraTokenBoost.on('strategy-deployed', (data) => {
  // Update UI to show active market making
  updateLiquidityPoolUI(data.strategy.token.address, {
    hasMarketMaking: true,
    strategy: data.strategy.type
  });
});
</script>`,
        react: `import { useState, useEffect } from 'react';

function LiquidityPoolInterface({ pairData }) {
  const [hasMarketMaking, setHasMarketMaking] = useState(false);

  useEffect(() => {
    // Load SDK when component mounts
    const script = document.createElement('script');
    script.src = 'https://valmira.xyz/tokenboost.js';
    script.setAttribute('data-partner-id', 'DEX456');
    script.setAttribute('data-theme', 'auto');
    script.setAttribute('data-primary-color', '#ff6b35');

    script.onload = () => {
      window.ValmiraTokenBoost?.on('strategy-deployed', (data) => {
        setHasMarketMaking(true);
        toast.success('Market making activated! 🎯');
      });
    };

    document.head.appendChild(script);
  }, []);

  const handleOptimizeReturns = () => {
    window.ValmiraTokenBoost?.setTokens([pairData.token0]);
    window.ValmiraTokenBoost?.open();
  };

  return (
    <div className="liquidity-pool">
      <h3>Your Liquidity Position</h3>
      <div className="pool-stats">
        <span>APR: {pairData.apr}%</span>
        {hasMarketMaking && (
          <Badge variant="success">Market Making Active ⚡</Badge>
        )}
      </div>

      {!hasMarketMaking && (
        <Button onClick={handleOptimizeReturns} variant="outline">
          ⚡ Optimize Returns
        </Button>
      )}
    </div>
  );
}`,
      },
    },
    portfolio: {
      title: 'Portfolio Tracker Integration',
      description:
        'Perfect for portfolio tracking apps that want to offer market making services for held tokens.',
      icon: <Code className="h-5 w-5" />,
      useCase:
        'Allow users to start market making for any token in their portfolio.',
      code: {
        html: `<!-- Add to your portfolio dashboard -->
<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="PORTFOLIO789"
  data-theme="light"
  data-primary-color="#8b5cf6"
  data-position="bottom-left"
  data-trigger-text="📈 Boost Portfolio">
</script>

<script>
// Add boost button to each token row
function addBoostButtons() {
  document.querySelectorAll('.token-row').forEach(row => {
    const tokenData = JSON.parse(row.dataset.token);

    const boostBtn = document.createElement('button');
    boostBtn.textContent = '🚀 Boost';
    boostBtn.className = 'boost-btn';
    boostBtn.onclick = () => {
      ValmiraTokenBoost.setTokens([tokenData]);
      ValmiraTokenBoost.open();
    };

    row.appendChild(boostBtn);
  });
}

// Track performance improvements
ValmiraTokenBoost.on('strategy-deployed', (data) => {
  // Mark token as having active market making
  const tokenRow = document.querySelector(\`[data-address="\${data.strategy.token.address}"]\`);
  if (tokenRow) {
    tokenRow.classList.add('has-market-making');
    tokenRow.querySelector('.boost-btn').textContent = '✅ Active';
  }
});
</script>`,
        react: `import { useState } from 'react';

function PortfolioTokenRow({ token, balance, value }) {
  const [hasMarketMaking, setHasMarketMaking] = useState(false);

  const handleBoostToken = () => {
    window.ValmiraTokenBoost?.setTokens([token]);
    window.ValmiraTokenBoost?.open();
  };

  useEffect(() => {
    // Listen for strategy deployment for this specific token
    const handleStrategyDeployed = (data) => {
      if (data.strategy.token.address.toLowerCase() === token.address.toLowerCase()) {
        setHasMarketMaking(true);
      }
    };

    window.ValmiraTokenBoost?.on('strategy-deployed', handleStrategyDeployed);

    return () => {
      window.ValmiraTokenBoost?.off('strategy-deployed', handleStrategyDeployed);
    };
  }, [token.address]);

  return (
    <tr className="token-row">
      <td>
        <div className="token-info">
          <img src={token.logoURI} alt={token.symbol} />
          <span>{token.symbol}</span>
          {hasMarketMaking && <Badge variant="success">MM Active</Badge>}
        </div>
      </td>
      <td>{balance}</td>
      <td>\${value}</td>
      <td>
        <Button
          size="sm"
          variant={hasMarketMaking ? "outline" : "default"}
          onClick={handleBoostToken}
          disabled={hasMarketMaking}
        >
          {hasMarketMaking ? '✅ Active' : '🚀 Boost'}
        </Button>
      </td>
    </tr>
  );
}`,
      },
    },
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          TokenBoost Integration Examples
        </h1>
        <p className="text-muted-foreground">
          Real-world examples of how to integrate the TokenBoost widget into
          different types of platforms.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(examples).map(([key, example]) => (
          <Card key={key} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {example.icon}
                {example.title}
              </CardTitle>
              <p className="text-muted-foreground">{example.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Use Case</Badge>
                <span className="text-sm">{example.useCase}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html">Vanilla JS</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="space-y-4">
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code.html}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(example.code.html, `${key}-html`)
                      }
                    >
                      {copiedCode === `${key}-html` ? (
                        'Copied!'
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="react" className="space-y-4">
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code.react}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(example.code.react, `${key}-react`)
                      }
                    >
                      {copiedCode === `${key}-react` ? (
                        'Copied!'
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Advanced Configuration Options</CardTitle>
          <p className="text-muted-foreground">
            Customize the widget behavior and appearance to match your platform.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Basic Configuration</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                {`<script src="https://valmira.xyz/tokenboost.js"
  data-partner-id="YOUR_ID"
  data-theme="light|dark|auto"
  data-primary-color="#hex-color"
  data-position="bottom-right|bottom-left|top-right|top-left|center"
  data-trigger-text="Custom Button Text"
  data-auto-open="true|false"
  data-allowed-origins="domain1.com,domain2.com">
</script>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Programmatic Control</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                {`// Open/close widget
ValmiraTokenBoost.open();
ValmiraTokenBoost.close();

// Set tokens
ValmiraTokenBoost.setTokens([tokenData]);

// Listen to events
ValmiraTokenBoost.on('strategy-deployed', callback);

// Update configuration
ValmiraTokenBoost.updateConfig({
  primaryColor: '#new-color',
  theme: 'dark'
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button asChild>
          <a
            href="/embed/tokenboost/test"
            className="inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Try Live Demo
          </a>
        </Button>
      </div>
    </div>
  );
}
