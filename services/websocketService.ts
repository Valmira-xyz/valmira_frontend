import { io, Socket } from 'socket.io-client';

// WebSocket events enumeration
export enum WebSocketEvents {
  PROJECT_METRICS_UPDATED = 'project:metrics:updated',
  BOT_PERFORMANCE_UPDATED = 'bot:performance:updated',
  ACTIVITY_LOG_ADDED = 'activity:log:added',
  TIME_SERIES_UPDATED = 'timeseries:updated',
  VOLUME_GENERATION_UPDATED = 'volume:generation:updated',
  HOLDER_GENERATION_UPDATED = 'holder:generation:updated',
}

// Event handler type definition
type EventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 5;
  private projectId: string | null = null;

  // Connect to the WebSocket server
  connect(apiUrl?: string): void {
    if (this.isConnected && this.socket) {
      return;
    }

    const url =
      apiUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
  }

  // Setup WebSocket event listeners
  private setupListeners(): void {
    if (!this.socket) {
      console.warn('🔌 [WebSocket] Setup failed: No socket instance available');
      return;
    }

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      console.log('🔌 [WebSocket] Connected successfully', {
        socketId: this.socket?.id,
        timestamp: new Date().toISOString(),
      });

      // If we were previously subscribed to a project, resubscribe
      if (this.projectId) {
        console.log('🔌 [WebSocket] Resubscribing to project', {
          projectId: this.projectId,
          timestamp: new Date().toISOString(),
        });
        this.joinProject(this.projectId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn('🔌 [WebSocket] Disconnected:', {
        reason,
        reconnectionAttempts: this.reconnectionAttempts,
        maxReconnectionAttempts: this.maxReconnectionAttempts,
        timestamp: new Date().toISOString(),
      });

      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the connection
        if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
          this.reconnectionAttempts++;
          console.log(
            '🔌 [WebSocket] Attempting server disconnect reconnection',
            {
              attempt: this.reconnectionAttempts,
              timestamp: new Date().toISOString(),
            }
          );
          setTimeout(() => {
            this.socket?.connect();
          }, 1000);
        }
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Client-side socket connection issues - try to reconnect
        if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
          this.reconnectionAttempts++;
          console.log(
            '🔌 [WebSocket] Attempting transport/timeout reconnection',
            {
              attempt: this.reconnectionAttempts,
              timestamp: new Date().toISOString(),
            }
          );
          setTimeout(() => {
            this.socket?.connect();
          }, 2000);
        }
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 [WebSocket] Reconnected successfully', {
        attemptNumber,
        timestamp: new Date().toISOString(),
      });

      if (this.projectId) {
        console.log('🔌 [WebSocket] Resubscribing to project after reconnect', {
          projectId: this.projectId,
          timestamp: new Date().toISOString(),
        });
        this.joinProject(this.projectId);
      }
    });

    this.socket.on('error', (error) => {
      console.error('🔌 [WebSocket] Connection error:', {
        error,
        timestamp: new Date().toISOString(),
      });
    });

    // Set up listeners for all event types
    Object.values(WebSocketEvents).forEach((eventType) => {
      this.socket?.on(eventType, (data) => {
        console.log(`📡 [WebSocket] Received event: ${eventType}`, {
          data,
          timestamp: new Date().toISOString(),
          handlers: this.eventHandlers.get(eventType)?.size || 0,
        });

        const handlers = this.eventHandlers.get(eventType);
        if (handlers && handlers.size > 0) {
          handlers.forEach((handler) => {
            try {
              handler(data);
            } catch (error) {
              console.error(
                `🔌 [WebSocket] Error in handler for ${eventType}:`,
                {
                  error,
                  data,
                  timestamp: new Date().toISOString(),
                }
              );
            }
          });
        } else {
          console.warn(
            `🔌 [WebSocket] No handlers registered for event: ${eventType}`,
            {
              timestamp: new Date().toISOString(),
            }
          );
        }
      });
    });
  }

  // Join a project room to receive project-specific events
  joinProject(projectId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('🔌 [WebSocket] Cannot join project: Socket not connected', {
        projectId,
        isConnected: this.isConnected,
        hasSocket: !!this.socket,
        timestamp: new Date().toISOString(),
      });
      // Store projectId for reconnection
      this.projectId = projectId;
      return;
    }

    console.log('🔌 [WebSocket] Joining project room', {
      projectId,
      socketId: this.socket.id,
      timestamp: new Date().toISOString(),
    });
    this.socket.emit('joinProject', projectId);
    this.projectId = projectId;
  }

  // Leave a project room
  leaveProject(projectId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leaveProject', projectId);

    if (this.projectId === projectId) {
      this.projectId = null;
    }
  }

  // Subscribe to a specific event
  subscribe(event: WebSocketEvents, handler: EventHandler): void {
    if (!this.socket) {
      console.warn('🔌 [WebSocket] Cannot subscribe: Socket not initialized', {
        event,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Create a handler set if none exists
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    const handlers = this.eventHandlers.get(event);

    if (handlers) {
      // Convert Set to Array to check if handler exists
      const handlersArray = Array.from(handlers);
      const isAlreadyRegistered = handlersArray.some((h) => h === handler);

      if (!isAlreadyRegistered) {
        // Add the handler if it's not already registered
        handlers.add(handler);
        console.log('🔌 [WebSocket] Subscribed to event', {
          event,
          totalHandlers: handlers.size,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn('🔌 [WebSocket] Handler already registered for event', {
          event,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // Unsubscribe from a specific event
  unsubscribe(event: WebSocketEvents, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.isConnected = false;
    this.socket = null;
    this.eventHandlers.clear();
    this.projectId = null;
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
