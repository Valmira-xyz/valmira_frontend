/* eslint-env browser */
/**
 * Valmira TokenBoost Widget SDK
 * Enhanced version with better communication and error handling
 */
(function () {
  'use strict';

  // Get script attributes
  const script = document.currentScript;
  const partnerId = script.getAttribute('data-partner-id') || '';
  const theme = script.getAttribute('data-theme') || 'light';
  const primaryColor = script.getAttribute('data-primary-color') || '#3b82f6';
  const position = script.getAttribute('data-position') || 'bottom-right';
  const triggerText =
    script.getAttribute('data-trigger-text') || 'Boost Your Token';
  const autoOpen = script.getAttribute('data-auto-open') === 'true';
  const allowedOrigins = script
    .getAttribute('data-allowed-origins')
    ?.split(',') || ['*'];
  const baseUrl =
    script.getAttribute('data-base-url') || 'http://localhost:3000';

  // Configuration object
  const config = {
    partnerId,
    theme,
    primaryColor,
    position,
    triggerText,
    autoOpen,
    allowedOrigins,
    baseUrl,
  };

  console.log('TokenBoost SDK initialized:', config);

  // Validation
  if (!partnerId) {
    console.warn(
      'TokenBoost SDK: No partner ID provided. Widget may not function correctly.'
    );
  }

  // State management
  let isWidgetOpen = false;
  let isWidgetReady = false;
  let detectedTokens = [];
  let eventListeners = {};
  let analytics = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    events: [],
  };

  // Generate unique session ID
  function generateSessionId() {
    return 'tb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Analytics tracking
  function trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: analytics.sessionId,
      partnerId: partnerId,
      data: data,
    };

    analytics.events.push(event);

    // Send to analytics endpoint (if configured)
    if (config.analyticsEndpoint) {
      fetch(config.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {}); // Silently fail analytics
    }

    console.log('TokenBoost Analytics:', event);
  }

  // Create widget container
  const container = document.createElement('div');
  container.id = 'valmira-tokenboost-container';
  container.style.cssText = `
    position: fixed;
    z-index: 9999;
    display: none;
    width: 400px;
    height: 600px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    background: white;
  `;

  // Set container position
  const setPosition = (pos) => {
    const offset = '20px';
    container.style.top = 'auto';
    container.style.bottom = 'auto';
    container.style.left = 'auto';
    container.style.right = 'auto';

    switch (pos) {
      case 'bottom-right':
        container.style.bottom = offset;
        container.style.right = offset;
        break;
      case 'bottom-left':
        container.style.bottom = offset;
        container.style.left = offset;
        break;
      case 'top-right':
        container.style.top = offset;
        container.style.right = offset;
        break;
      case 'top-left':
        container.style.top = offset;
        container.style.left = offset;
        break;
      case 'center':
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        break;
      default:
        container.style.bottom = offset;
        container.style.right = offset;
    }
  };

  setPosition(position);

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'valmira-tokenboost-iframe';
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  `;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-forms allow-popups'
  );

  // Generate iframe URL with parameters
  const params = new URLSearchParams({
    'data-partner-id': partnerId,
    'data-theme': theme,
    'data-primary-color': primaryColor,
  });
  iframe.src = `${baseUrl}/embed/tokenboost?${params.toString()}`;

  // Create trigger button
  const triggerButton = document.createElement('button');
  triggerButton.id = 'valmira-tokenboost-trigger';
  triggerButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
    ${triggerText}
  `;
  triggerButton.style.cssText = `
    position: fixed;
    z-index: 9998;
    padding: 12px 16px;
    border-radius: 25px;
    background-color: ${primaryColor};
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.2s ease;
    user-select: none;
  `;

  // Set trigger button position
  setPosition(position);
  const buttonOffset = '20px';
  switch (position) {
    case 'bottom-right':
      triggerButton.style.bottom = buttonOffset;
      triggerButton.style.right = buttonOffset;
      break;
    case 'bottom-left':
      triggerButton.style.bottom = buttonOffset;
      triggerButton.style.left = buttonOffset;
      break;
    case 'top-right':
      triggerButton.style.top = buttonOffset;
      triggerButton.style.right = buttonOffset;
      break;
    case 'top-left':
      triggerButton.style.top = buttonOffset;
      triggerButton.style.left = buttonOffset;
      break;
    default:
      triggerButton.style.bottom = buttonOffset;
      triggerButton.style.right = buttonOffset;
  }

  // Add hover effects
  triggerButton.addEventListener('mouseenter', () => {
    triggerButton.style.transform = 'scale(1.05)';
    triggerButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
  });

  triggerButton.addEventListener('mouseleave', () => {
    triggerButton.style.transform = 'scale(1)';
    triggerButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  });

  // Event system
  const emit = (eventName, data) => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `TokenBoost SDK: Error in ${eventName} listener:`,
            error
          );
        }
      });
    }

    // Also dispatch as DOM event
    const customEvent = new CustomEvent(`valmira-${eventName}`, {
      detail: data,
    });
    document.dispatchEvent(customEvent);
  };

  // Widget functions
  const openWidget = () => {
    if (isWidgetOpen) return;

    isWidgetOpen = true;
    container.style.display = 'block';
    triggerButton.style.display = 'none';

    // Track analytics
    trackEvent('widget_opened', {
      hasTokens: detectedTokens.length > 0,
      tokenCount: detectedTokens.length,
    });

    // Send token detection if available
    if (detectedTokens.length > 0 && isWidgetReady) {
      setTimeout(() => {
        iframe.contentWindow.postMessage(
          {
            type: 'tokenDetection',
            tokens: detectedTokens,
          },
          '*'
        );

        trackEvent('tokens_sent', {
          tokenCount: detectedTokens.length,
          tokens: detectedTokens.map((t) => ({
            symbol: t.symbol,
            address: t.address,
          })),
        });
      }, 500);
    }

    emit('widget-opened', { partnerId });
  };

  const closeWidget = () => {
    if (!isWidgetOpen) return;

    isWidgetOpen = false;
    container.style.display = 'none';
    triggerButton.style.display = 'block';

    emit('widget-closed', { partnerId });
  };

  // Message handling with origin validation
  const isOriginAllowed = (origin) => {
    if (allowedOrigins.includes('*')) return true;
    return allowedOrigins.some((allowed) => {
      if (allowed.startsWith('http')) {
        return origin === allowed;
      }
      return origin.includes(allowed);
    });
  };

  // Listen for messages from iframe
  window.addEventListener('message', function (event) {
    // Origin validation
    if (!isOriginAllowed(event.origin)) {
      console.warn(
        'TokenBoost SDK: Message from unauthorized origin:',
        event.origin
      );
      return;
    }

    const { type, ...data } = event.data || {};

    switch (type) {
      case 'valmira-widget-ready':
        isWidgetReady = true;
        console.log('TokenBoost Widget ready:', data);
        trackEvent('widget_ready', data);
        emit('widget-ready', data);
        break;

      case 'valmira-widget-close':
        closeWidget();
        break;

      case 'valmira-strategy-deployed':
        console.log('Strategy deployed:', data.strategy);
        trackEvent('strategy_deployed', {
          strategy: data.strategy,
          conversionTime: Date.now() - analytics.startTime,
        });
        emit('strategy-deployed', data);

        // Auto-close after 3 seconds
        setTimeout(() => {
          closeWidget();
        }, 3000);
        break;

      case 'valmira-widget-error':
        console.error('Widget error:', data.error);
        emit('widget-error', data);
        break;

      default:
        // Forward unknown messages to listeners
        if (type && type.startsWith('valmira-')) {
          emit(type.replace('valmira-', ''), data);
        }
    }
  });

  // Button click handler
  triggerButton.addEventListener('click', openWidget);

  // Add elements to the page
  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(triggerButton);

  // Auto-open if configured
  if (autoOpen) {
    // Wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(openWidget, 1000);
      });
    } else {
      setTimeout(openWidget, 1000);
    }
  }

  // Public API
  window.ValmiraTokenBoost = {
    // Core functions
    open: openWidget,
    close: closeWidget,

    // Configuration
    setTokens: function (tokens) {
      detectedTokens = Array.isArray(tokens) ? tokens : [tokens];
      console.log('TokenBoost: Tokens set:', detectedTokens);

      if (isWidgetOpen && isWidgetReady) {
        iframe.contentWindow.postMessage(
          {
            type: 'tokenDetection',
            tokens: detectedTokens,
          },
          '*'
        );
      }
    },

    updateConfig: function (newConfig) {
      Object.assign(config, newConfig);

      if (newConfig.primaryColor) {
        triggerButton.style.backgroundColor = newConfig.primaryColor;
      }

      if (newConfig.position) {
        setPosition(newConfig.position);
      }

      if (isWidgetOpen && isWidgetReady) {
        iframe.contentWindow.postMessage(
          {
            type: 'updateConfig',
            config: newConfig,
          },
          '*'
        );
      }
    },

    // Event system
    on: function (eventName, callback) {
      if (!eventListeners[eventName]) {
        eventListeners[eventName] = [];
      }
      eventListeners[eventName].push(callback);
    },

    off: function (eventName, callback) {
      if (eventListeners[eventName]) {
        const index = eventListeners[eventName].indexOf(callback);
        if (index > -1) {
          eventListeners[eventName].splice(index, 1);
        }
      }
    },

    // State getters
    isOpen: () => isWidgetOpen,
    isReady: () => isWidgetReady,
    getConfig: () => ({ ...config }),
    getTokens: () => [...detectedTokens],

    // Analytics
    getAnalytics: () => ({ ...analytics }),
    trackCustomEvent: (eventName, data) => trackEvent(eventName, data),

    // Utility
    version: '1.0.0',
  };

  // Ensure SDK is properly exposed and ready
  const ensureSDKReady = () => {
    if (!window.ValmiraTokenBoost) {
      console.error('TokenBoost SDK failed to initialize');
      return false;
    }
    return true;
  };

  // Add SDK readiness check
  window.ValmiraTokenBoost.isSDKReady = () => {
    return (
      typeof window.ValmiraTokenBoost === 'object' &&
      typeof window.ValmiraTokenBoost.open === 'function'
    );
  };

  // Add configuration validation
  window.ValmiraTokenBoost.validateConfig = () => {
    const requiredFields = ['partnerId'];
    const missing = requiredFields.filter((field) => !config[field]);

    if (missing.length > 0) {
      console.warn('TokenBoost SDK: Missing required config fields:', missing);
      return { valid: false, missing };
    }

    return { valid: true, missing: [] };
  };

  // Add memory cleanup method
  window.ValmiraTokenBoost.cleanup = () => {
    try {
      // Remove event listeners
      window.removeEventListener('message', arguments.callee);
      triggerButton.removeEventListener('click', openWidget);

      // Clear intervals and timeouts
      if (window.ValmiraTokenBoostTimers) {
        window.ValmiraTokenBoostTimers.forEach((timer) => clearTimeout(timer));
        window.ValmiraTokenBoostTimers = [];
      }

      // Remove DOM elements
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (triggerButton && triggerButton.parentNode) {
        triggerButton.parentNode.removeChild(triggerButton);
      }

      // Clear references
      eventListeners = {};
      detectedTokens = [];
      analytics.events = [];

      console.log('TokenBoost SDK cleanup completed');
      return true;
    } catch (error) {
      console.error('TokenBoost SDK cleanup error:', error);
      return false;
    }
  };

  // Expose for debugging
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    window.ValmiraTokenBoostDebug = {
      container,
      iframe,
      triggerButton,
      config,
      state: {
        isWidgetOpen: () => isWidgetOpen,
        isWidgetReady: () => isWidgetReady,
        detectedTokens: () => detectedTokens,
      },
      cleanup: window.ValmiraTokenBoost.cleanup,
      validateConfig: window.ValmiraTokenBoost.validateConfig,
    };
  }

  // Final SDK readiness validation
  if (ensureSDKReady()) {
    console.log(
      'TokenBoost SDK loaded successfully. Version:',
      window.ValmiraTokenBoost.version
    );

    // Dispatch ready event
    const readyEvent = new CustomEvent('valmira-sdk-ready', {
      detail: {
        version: window.ValmiraTokenBoost.version,
        config: config,
        partnerId: partnerId,
      },
    });
    document.dispatchEvent(readyEvent);
  } else {
    console.error('TokenBoost SDK failed final readiness check');
  }
})();
