'use client';

import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import websocketService, { WebSocketEvents } from '@/services/websocketService';

// Define notification interface for passive snipe results
interface PassiveSnipeNotification {
  id: string;
  timestamp: Date;
  status:
    | 'execution_succeeded'
    | 'execution_failed'
    | 'threshold_not_met'
    | 'error'
    | 'cron_error'
    | 'requests_expired';
  tokenAddress?: string;
  symbol?: string;
  tokenAmount?: number;
  error?: string;
  currentPrice?: number;
  priceThreshold?: number;
  createdAt?: Date;
  count?: number;
  read: boolean;
}

interface PassiveSnipeNotificationProps {
  userId: string;
}

export function PassiveSnipeNotification({
  userId,
}: PassiveSnipeNotificationProps) {
  const [notifications, setNotifications] = useState<
    PassiveSnipeNotification[]
  >([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Connect to WebSocket and listen for passive snipe events
  useEffect(() => {
    if (!userId) return;

    // Ensure connection
    websocketService.connect();

    // Handle passive snipe results
    const handleSnipeResult = (data: any) => {
      console.log('⭐ [WebSocket] Received SNIPE_RESULT event:', {
        event: WebSocketEvents.SNIPE_RESULT,
        timestamp: new Date().toISOString(),
        userId: data?.data?.userId,
        expectedUserId: userId,
        status: data?.data?.status,
      });

      if (!data?.data) {
        console.warn('❌ [WebSocket] No data received in SNIPE_RESULT event');
        return;
      }

      if (data.data.userId !== userId) {
        console.log('[WebSocket] User ID mismatch, skipping notification');
        return;
      }

      // Create notification based on status
      const newNotification: PassiveSnipeNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(data.timestamp || Date.now()),
        status: data.data.status,
        tokenAddress: data.data.tokenAddress,
        symbol: data.data.symbol,
        tokenAmount: data.data.tokenAmount,
        error: data.data.error,
        currentPrice: data.data.currentPrice,
        priceThreshold: data.data.priceThreshold,
        count: data.data.count,
        createdAt: data.data.createdAt,
        read: false,
      };

      // Check for duplicate notifications (same status and token address within last 5 seconds)
      notifications.forEach((n) => {
        console.log(`newNotification.createdAt: ${newNotification.createdAt}`);
        console.log(`existing notification.createdAt: ${n.createdAt}`);
        console.log(
          `is equal: ${new Date(n.createdAt!).getTime() === new Date(newNotification.createdAt!).getTime()}`
        );
        if (
          n.tokenAddress === newNotification.tokenAddress &&
          n.createdAt &&
          newNotification.createdAt &&
          new Date(n.createdAt).getTime() ===
            new Date(newNotification.createdAt).getTime()
        ) {
          console.log(
            '📬 [WebSocket] Duplicate notification detected, skipping'
          );
          return;
        }
      });

      console.log('📬 [WebSocket] Creating new notification:', {
        id: newNotification.id,
        timestamp: newNotification.timestamp.toISOString(),
        status: newNotification.status,
      });

      // Add to notifications
      setNotifications((prev) => [newNotification, ...prev].slice(0, 30)); // Keep most recent 30
      setHasUnread(true);

      // Show toast notification
      toast.success(
        `Passive Snipe: ${formatNotificationMessage(newNotification)}`,
        {
          id: `snipe-${Date.now()}`,
          duration: 5000,
        }
      );
    };

    // Subscribe to snipe result events
    const unsubscribe = websocketService.subscribe(
      WebSocketEvents.SNIPE_RESULT,
      handleSnipeResult
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Format notification message based on status
  const formatNotificationMessage = (
    notification: PassiveSnipeNotification
  ) => {
    const formatTokenAddress = (address?: string) => {
      if (!address) return '';
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    };

    switch (notification.status) {
      case 'execution_succeeded':
        return `Successfully sniped token ${formatTokenAddress(notification.tokenAddress)} ${notification.symbol ? `(${notification.symbol})` : ''} ${notification.tokenAmount ? `(Amount: ${notification.tokenAmount})` : ''}`;
      case 'execution_failed':
        return `Passive snipe for ${formatTokenAddress(notification.tokenAddress)} ${notification.symbol ? `(${notification.symbol})` : ''} ${notification.tokenAmount ? `(Amount: ${notification.tokenAmount})` : ''} failed due to ${notification.error} `;
      case 'threshold_not_met':
        return `Price threshold not met. Current: ${notification.currentPrice}, Target: ${notification.priceThreshold} ${notification.symbol ? `(${notification.symbol})` : ''} ${notification.tokenAmount ? `(Amount: ${notification.tokenAmount})` : ''}`;
      case 'requests_expired':
        return `${notification.count} passive snipe requests have expired ${formatTokenAddress(notification.tokenAddress)} ${notification.symbol ? `(${notification.symbol})` : ''} ${notification.tokenAmount ? `(Amount: ${notification.tokenAmount})` : ''}`;
      case 'error':
        return `Passive snipe for ${formatTokenAddress(notification.tokenAddress)} ${notification.symbol ? `(${notification.symbol})` : ''} ${notification.tokenAmount ? `(Amount: ${notification.tokenAmount})` : ''} failed due to ${notification.error} `;
      default:
        return 'Unknown status';
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    setHasUnread(false);
  };

  // Mark a single notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Check if there are any unread notifications left
    const hasUnreadLeft = notifications.some((n) => n.id !== id && !n.read);
    setHasUnread(hasUnreadLeft);
  };

  // Handle removing a notification
  const handleRemoveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    // Check if there are any unread notifications left
    const hasUnreadLeft = notifications.some((n) => n.id !== id && !n.read);
    setHasUnread(hasUnreadLeft);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 max-h-96 overflow-y-auto"
        >
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-7"
              >
                Mark all as read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 relative ${notification.read ? 'opacity-70' : 'font-medium'}`}
              >
                <div className="w-full flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {notification.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {!notification.read && (
                      <div
                        className=" w-2 h-2 rounded-full bg-blue-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1 -mt-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">
                  {formatNotificationMessage(notification)}
                </p>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
