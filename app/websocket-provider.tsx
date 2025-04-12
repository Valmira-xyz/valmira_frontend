'use client';

import { ReactNode, useEffect, useRef } from 'react';

import websocketService from '@/services/websocketService';

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * WebSocketProvider initializes the WebSocket connection when the app starts
 * and provides WebSocket connectivity for the entire application.
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const connectionInitialized = useRef(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only initialize the connection once
    if (connectionInitialized.current) {
      console.log('WebSocket connection already initialized, skipping');
      return;
    }

    console.log('🔄 Initializing WebSocket connection in WebSocketProvider');

    // Delay initial connection slightly to avoid competing with API requests
    setTimeout(() => {
      try {
        websocketService.connect();
        console.log('✅ WebSocket connection initialized successfully');
        connectionInitialized.current = true;
      } catch (error) {
        console.error('❌ Error initializing WebSocket connection:', error);
      }
    }, 2000); // 2 second delay before initializing WebSocket

    // Reconnect on visibility change (when user returns to tab) with debounce
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(
          '📱 Document became visible, checking WebSocket connection'
        );

        // Clear any existing reconnect timer
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }

        // Set a delay before reconnecting to avoid rapid connections
        reconnectTimer.current = setTimeout(() => {
          if (!websocketService.isSocketConnected()) {
            console.log('🔄 Reconnecting WebSocket due to visibility change');
            websocketService.connect();
          }
          reconnectTimer.current = null;
        }, 1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Clean up connection on app unmount
      console.log('🧹 Cleaning up WebSocket connection');
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      websocketService.disconnect();
    };
  }, []);

  return <>{children}</>;
}

export default WebSocketProvider;
