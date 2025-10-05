'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Code,
  Database,
  HelpCircle,
  Key,
} from 'lucide-react';
import Link from 'next/link';

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

export default function APIReferenceTutorial() {
  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/widget/config',
      description: 'Get widget configuration options',
      auth: 'API Key',
      parameters: [
        {
          name: 'widget_type',
          type: 'string',
          required: true,
          description: 'Type of widget (tokenboost, referral)',
        },
        {
          name: 'theme',
          type: 'string',
          required: false,
          description: 'Theme preference (light, dark, auto)',
        },
      ],
    },
    {
      method: 'POST',
      endpoint: '/api/widget/analytics',
      description: 'Track widget usage and events',
      auth: 'API Key',
      parameters: [
        {
          name: 'event_type',
          type: 'string',
          required: true,
          description: 'Type of event (load, interaction, conversion)',
        },
        {
          name: 'widget_id',
          type: 'string',
          required: true,
          description: 'Unique widget instance ID',
        },
        {
          name: 'user_data',
          type: 'object',
          required: false,
          description: 'Additional user context data',
        },
      ],
    },
    {
      method: 'GET',
      endpoint: '/api/widget/performance',
      description: 'Get widget performance metrics',
      auth: 'API Key',
      parameters: [
        {
          name: 'date_range',
          type: 'string',
          required: false,
          description: 'Date range for metrics (7d, 30d, 90d)',
        },
        {
          name: 'widget_type',
          type: 'string',
          required: false,
          description: 'Filter by widget type',
        },
      ],
    },
  ];

  const errorCodes = [
    {
      code: 400,
      message: 'Bad Request',
      description: 'Invalid parameters or malformed request',
    },
    {
      code: 401,
      message: 'Unauthorized',
      description: 'Invalid or missing API key',
    },
    {
      code: 403,
      message: 'Forbidden',
      description: 'API key lacks required permissions',
    },
    {
      code: 404,
      message: 'Not Found',
      description: 'Endpoint or resource not found',
    },
    {
      code: 429,
      message: 'Rate Limited',
      description: 'Too many requests, slow down',
    },
    {
      code: 500,
      message: 'Server Error',
      description: 'Internal server error, try again later',
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
              Widget API Reference
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight font-tt">
              Complete API Reference
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Technical documentation for Valmira Widget APIs, including
              authentication, endpoints, and error handling
            </p>
          </div>

          {/* API Overview */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                API Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Base URL & Authentication
                </h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium">Base URL:</p>
                    <code className="text-sm bg-background p-2 rounded border">
                      https://api.valmira.xyz/v1
                    </code>
                  </div>
                  <div>
                    <p className="font-medium">Authentication:</p>
                    <code className="text-sm bg-background p-2 rounded border">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>
                  <div>
                    <p className="font-medium">Content Type:</p>
                    <code className="text-sm bg-background p-2 rounded border">
                      Content-Type: application/json
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Rate Limits</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Standard Tier:</p>
                    <ul className="space-y-1 ml-4">
                      <li>- 1,000 requests per hour</li>
                      <li>- 100 requests per minute</li>
                      <li>- Burst limit: 200 requests</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Premium Tier:</p>
                    <ul className="space-y-1 ml-4">
                      <li>- 10,000 requests per hour</li>
                      <li>- 500 requests per minute</li>
                      <li>- Burst limit: 1,000 requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="api-key" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="api-key">API Key</TabsTrigger>
                  <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
                  <TabsTrigger value="webhook">Webhooks</TabsTrigger>
                </TabsList>

                <TabsContent value="api-key" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      API Key Authentication
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      The simplest authentication method using API keys from
                      your dashboard.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`// JavaScript example
const response = await fetch('https://api.valmira.xyz/v1/widget/config', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// cURL example
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.valmira.xyz/v1/widget/config`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="oauth" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">OAuth 2.0 Flow</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      For applications requiring user-specific permissions and
                      data access.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">
                          1. Authorization Request
                        </p>
                        <div className="bg-muted p-3 rounded">
                          <code className="text-sm">
                            https://valmira.xyz/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&scope=widget:read
                            widget:write
                          </code>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-2">2. Token Exchange</p>
                        <div className="bg-muted p-3 rounded">
                          <pre className="text-sm">
                            {`POST /oauth/token
{
  "grant_type": "authorization_code",
  "code": "AUTHORIZATION_CODE",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="webhook" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Webhook Configuration
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Receive real-time notifications about widget events and
                      user actions.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">
                          Webhook Payload Example
                        </p>
                        <div className="bg-muted p-3 rounded">
                          <pre className="text-sm">
                            {`{
  "event": "project.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "project_id": "proj_123456",
    "user_id": "user_789012",
    "widget_id": "widget_345678",
    "referral_code": "your_ref_code"
  },
  "signature": "sha256=..."
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {apiEndpoints.map((endpoint, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge
                            variant={
                              endpoint.method === 'GET'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm">{endpoint.endpoint}</code>
                        </CardTitle>
                        <Badge variant="outline">{endpoint.auth}</Badge>
                      </div>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h5 className="font-medium mb-2">Parameters:</h5>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-4 text-sm border-l-2 border-muted pl-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <code className="font-medium">
                                    {param.name}
                                  </code>
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                  {param.required && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground mt-1">
                                  {param.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Handling */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Handling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="error-codes">
                  <AccordionTrigger>HTTP Status Codes</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-3">
                      {errorCodes.map((error, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-3 border rounded-lg"
                        >
                          <Badge
                            variant={
                              error.code >= 500
                                ? 'destructive'
                                : error.code >= 400
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {error.code}
                          </Badge>
                          <div>
                            <p className="font-medium">{error.message}</p>
                            <p className="text-sm text-muted-foreground">
                              {error.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-response">
                  <AccordionTrigger>Error Response Format</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Standard Error Response
                      </h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm">
                          {`{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The widget_type parameter is required",
    "details": {
      "parameter": "widget_type",
      "expected": "string",
      "received": "undefined"
    },
    "request_id": "req_123456789"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="retry-logic">
                  <AccordionTrigger>
                    Retry Logic & Best Practices
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">
                        Recommended Retry Strategy
                      </h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm">
                          {`// JavaScript retry implementation
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(\`Client error: \${response.status}\`);
      }
      
      // Retry server errors (5xx) and rate limits (429)
      if (attempt === maxRetries) {
        throw new Error(\`Max retries exceeded: \${response.status}\`);
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* SDK Examples */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                SDK Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>

                <TabsContent value="javascript" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {`// Valmira Widget SDK
import { ValmiraAPI } from '@valmira/widget-sdk';

const api = new ValmiraAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.valmira.xyz/v1'
});

// Get widget configuration
const config = await api.widget.getConfig({
  widget_type: 'tokenboost',
  theme: 'dark'
});

// Track widget events
await api.widget.trackEvent({
  event_type: 'conversion',
  widget_id: 'widget_123',
  user_data: {
    project_id: 'proj_456',
    referral_code: 'ref_789'
  }
});

// Get performance metrics
const metrics = await api.widget.getPerformance({
  date_range: '30d',
  widget_type: 'tokenboost'
});`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {`# Valmira Python SDK
from valmira import ValmiraAPI

api = ValmiraAPI(
    api_key='your-api-key',
    base_url='https://api.valmira.xyz/v1'
)

# Get widget configuration
config = api.widget.get_config(
    widget_type='tokenboost',
    theme='dark'
)

# Track widget events
api.widget.track_event(
    event_type='conversion',
    widget_id='widget_123',
    user_data={
        'project_id': 'proj_456',
        'referral_code': 'ref_789'
    }
)

# Get performance metrics
metrics = api.widget.get_performance(
    date_range='30d',
    widget_type='tokenboost'
)`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="php" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {`<?php
// Valmira PHP SDK
use Valmira\\ValmiraAPI;

$api = new ValmiraAPI([
    'api_key' => 'your-api-key',
    'base_url' => 'https://api.valmira.xyz/v1'
]);

// Get widget configuration
$config = $api->widget->getConfig([
    'widget_type' => 'tokenboost',
    'theme' => 'dark'
]);

// Track widget events
$api->widget->trackEvent([
    'event_type' => 'conversion',
    'widget_id' => 'widget_123',
    'user_data' => [
        'project_id' => 'proj_456',
        'referral_code' => 'ref_789'
    ]
]);

// Get performance metrics
$metrics = $api->widget->getPerformance([
    'date_range' => '30d',
    'widget_type' => 'tokenboost'
]);
?>`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <Card className="border bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Ready to Use the API?</h3>
                <p className="text-muted-foreground">
                  Get your API key from the dashboard and start integrating with
                  our comprehensive APIs
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/dashboard/api-keys">Get API Key</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tutorials/widgets/troubleshooting">
                      Troubleshooting Guide
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
