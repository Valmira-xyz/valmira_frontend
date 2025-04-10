'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import websocketService, { WebSocketEvents } from '@/services/websocketService'
import { format } from 'date-fns'

// Define a notification interface based on activity log
interface Notification {
  id: string
  timestamp: Date
  description: string
  read: boolean
  botType: string
  action: string
}

interface AutoSellNotificationProps {
  projectId: string
}

export function AutoSellNotification({ projectId }: AutoSellNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  
  // Connect to WebSocket and listen for auto-sell events
  useEffect(() => {
    if (!projectId) return
    
    // Ensure connection and join project room
    websocketService.connect()
    websocketService.joinProject(projectId)
    
    // Handle activity log updates specifically for auto-sell activities
    const handleActivityUpdate = (data: any) => {
      console.log('⭐ [WebSocket] Received ACTIVITY_LOG_ADDED event:', {
        event: WebSocketEvents.ACTIVITY_LOG_ADDED,
        timestamp: new Date().toISOString(),
        projectId: data?.projectId,
        expectedProjectId: projectId,
        hasActivity: !!data?.activity,
        activityType: data?.activity?.type,
        botType: data?.activity?.botType,
        action: data?.activity?.action
      });
      
      if (!data) {
        console.warn('❌ [WebSocket] No data received in ACTIVITY_LOG_ADDED event');
        return;
      }
      
      if (data.projectId !== projectId) {
        console.warn(`❌ [WebSocket] Project ID mismatch in ACTIVITY_LOG_ADDED event: received ${data.projectId}, expected ${projectId}`);
        return;
      }
      
      if (!data.activity) {
        console.warn('❌ [WebSocket] No activity data in ACTIVITY_LOG_ADDED event');
        return;
      }
      
      if (data.activity.type !== 'bot') {
        console.warn(`❌ [WebSocket] Not a bot activity in ACTIVITY_LOG_ADDED event: ${data.activity.type}`);
        return;
      }
      
      if (data.activity.botType !== 'AutoSellBot') {
        console.warn(`❌ [WebSocket] Not an AutoSellBot in ACTIVITY_LOG_ADDED event: ${data.activity.botType}`);
        return;
      }
      
      console.log('✅ [WebSocket] Valid AutoSellBot activity detected:', {
        event: WebSocketEvents.ACTIVITY_LOG_ADDED,
        timestamp: new Date().toISOString(),
        projectId: data.projectId,
        activityTimestamp: data.activity.timestamp,
        description: data.activity.description,
        action: data.activity.action,
        botType: data.activity.botType
      });
      
      if (data.projectId === projectId && 
          data.activity && 
          data.activity.type === 'bot' && 
          data.activity.botType === 'AutoSellBot') {
        
        // Create a new notification object
        const newNotification = {
          id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date(data.activity.timestamp || Date.now()),
          description: data.activity.description || `${data.activity.action}: Tokens sold`,
          read: false,
          botType: data.activity.botType,
          action: data.activity.action
        }
        
        console.log('📬 [WebSocket] Creating new notification:', {
          id: newNotification.id,
          timestamp: newNotification.timestamp.toISOString(),
          description: newNotification.description,
          action: newNotification.action 
        });
        
        // Add to notifications
        setNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 30)
          console.log('📋 [WebSocket] Updated notifications count:', updated.length);
          return updated
        }) // Keep most recent 30
        setHasUnread(true)
        
        // Show toast notification
        toast.success(`Auto Sell Bot: ${data.activity.description || 'Tokens sold'}`, {
          id: `autosell-${Date.now()}`,
          duration: 5000
        })
        console.log('🔔 [WebSocket] Toast notification displayed for AutoSellBot activity');
      }
    }
    
    // Subscribe to activity log updates
    websocketService.subscribe(WebSocketEvents.ACTIVITY_LOG_ADDED, handleActivityUpdate)
    
    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe(WebSocketEvents.ACTIVITY_LOG_ADDED, handleActivityUpdate)
    }
  }, [projectId])
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setHasUnread(false)
  }
  
  // Mark a single notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    )
    
    // Check if there are any unread notifications left
    const hasUnreadLeft = notifications.some(n => n.id !== id && !n.read)
    setHasUnread(hasUnreadLeft)
  }
  
  // Handle removing a notification
  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
    
    // Check if there are any unread notifications left
    const hasUnreadLeft = notifications.some(n => n.id !== id && !n.read)
    setHasUnread(hasUnreadLeft)
  }
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), 'MMM d, h:mm a')
  }
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
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
                  <span className="text-sm font-medium">
                    {notification.botType}: {notification.action}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1 -mt-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveNotification(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">
                  {notification.description}
                </p>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(notification.timestamp)}
                </span>
                {!notification.read && (
                  <div 
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notification.id)
                    }}
                  />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 