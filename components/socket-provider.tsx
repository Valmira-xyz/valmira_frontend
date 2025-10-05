'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useToast } from '@/components/ui/use-toast';
import websocketService, { WebSocketEvents } from '@/services/websocketService';
import { RootState } from '@/store/store';

interface SnipeResult {
  status:
    | 'execution_succeeded'
    | 'execution_failed'
    | 'threshold_not_met'
    | 'error'
    | 'cron_error'
    | 'requests_expired';
  requestId?: string;
  userId?: string;
  projectId?: string;
  tokenAddress?: string;
  error?: string;
  currentPrice?: number;
  priceThreshold?: number;
  count?: number;
  message?: any;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  // Get user ID from Redux store
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const userId = user?._id;

  useEffect(() => {
    // Only initialize WebSocket if user is authenticated
    if (!isAuthenticated || !userId) {
      console.log('[WebSocket] User not authenticated, skipping connection');
      return;
    }

    console.log('[WebSocket] Initializing connection...');

    // Connect to WebSocket server
    websocketService.connect();

    // Subscribe to snipe result events
    const unsubscribe = websocketService.subscribe(
      WebSocketEvents.SNIPE_RESULT,
      (data: { type: string; data: SnipeResult; timestamp: string }) => {
        console.log('[WebSocket] Received snipe result:', data);

        if (!data?.data) {
          console.warn('[WebSocket] Received empty data');
          return;
        }

        const result = data.data;
        console.log('[WebSocket] Snipe result status:', result);

        // Format token address for display
        const formatTokenAddress = (address?: string) => {
          if (!address) return '';
          return `${address.substring(0, 6)}...${address.substring(38)}`;
        };

        if (result.userId !== userId) {
          console.log(
            '[WebSocket] User ID mismatch passive Snipe result is for other user, skipping'
          );
          return;
        }

        switch (result.status) {
          case 'execution_succeeded':
            toast({
              title: 'Passive Snipe Successful! 🚀',
              description: `Successfully sniped token ${formatTokenAddress(result.tokenAddress)}`,
              variant: 'default',
              duration: 8000,
            });
            break;

          case 'execution_failed':
            toast({
              title: 'Passive Snipe Error ⚠️',
              description: `Passive Snipe Failed for ${formatTokenAddress(result.tokenAddress)} due to: ${result.error}`,
              variant: 'destructive',
              duration: 8000,
            });
            break;

          case 'threshold_not_met':
            console.log(
              `[WebSocket] Price threshold not met. Current: ${result.currentPrice}, Target: ${result.priceThreshold}`
            );
            break;

          case 'error':
            toast({
              title: 'Passive Snipe Error ⚠️',
              description: `Passive Snipe Failed for ${formatTokenAddress(result.tokenAddress)} due to: ${result.error}`,
              variant: 'destructive',
              duration: 8000,
            });
            break;

          case 'cron_error':
            console.error(
              '[WebSocket] Passive snipe cron error:',
              result.error
            );
            if (result.error?.includes('critical')) {
              toast({
                title: 'System Error',
                description:
                  'A critical error occurred in the passive snipe system',
                variant: 'destructive',
                duration: 5000,
              });
            }
            break;

          case 'requests_expired':
            toast({
              title: 'Passive Snipe Requests Expired',
              description: `${result.count} passive snipe requests have expired`,
              variant: 'default',
              duration: 5000,
            });
            break;

          default:
            console.log('[WebSocket] Received unknown status:', result);
            toast({
              title: `Snipe Result: ${result.status || 'Unknown'}`,
              description: JSON.stringify(result.message || {}),
              duration: 5000,
            });
        }
      }
    );

    // Clean up on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection...');
      unsubscribe();
      websocketService.disconnect();
    };
  }, [isAuthenticated, userId, toast]);

  return <>{children}</>;
}

export default SocketProvider;
