import { apiClient } from './apiService';

export interface WidgetErrorData {
  timestamp?: string;
  partnerId: string;
  context: string;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  userAgent?: string;
  url?: string;
  widgetState?: string;
  user?: {
    id: string;
    address: string;
  } | null;
}

export interface WidgetAnalyticsData {
  sessionId?: string;
  partnerId: string;
  events: Array<{
    name: string;
    timestamp?: number;
    data?: Record<string, any>;
  }>;
}

export interface WidgetConfigData {
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | 'center';
  triggerText?: string;
  autoDetect?: boolean;
  autoOpen?: boolean;
  allowedOrigins?: string[];
  features?: string[];
}

export const widgetService = {
  // Error logging
  async logError(
    errorData: WidgetErrorData
  ): Promise<{ success: boolean; errorId?: string }> {
    try {
      const response = await apiClient.post('/widget/errors', errorData);
      return response.data;
    } catch (error) {
      console.error('Failed to log widget error:', error);
      return { success: false };
    }
  },

  // Analytics tracking
  async trackAnalytics(
    analyticsData: WidgetAnalyticsData
  ): Promise<{ success: boolean; sessionId?: string }> {
    try {
      const response = await apiClient.post(
        '/widget/analytics',
        analyticsData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to track widget analytics:', error);
      return { success: false };
    }
  },

  // Get partner configuration
  async getPartnerConfig(
    partnerId: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.get(`/widget/config/${partnerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get partner config:', error);
      return { success: false };
    }
  },

  // Update partner configuration
  async updatePartnerConfig(
    partnerId: string,
    config: WidgetConfigData
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.put(`/widget/config/${partnerId}`, {
        partnerId,
        config,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update partner config:', error);
      return { success: false };
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(
    partnerId: string,
    timeRange: string = '24h'
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.get(
        `/widget/metrics?partnerId=${partnerId}&timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { success: false };
    }
  },

  // Get error summary
  async getErrorSummary(
    partnerId: string,
    timeRange: string = '24h'
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await apiClient.get(
        `/widget/errors/summary?partnerId=${partnerId}&timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get error summary:', error);
      return { success: false };
    }
  },

  // Widget health check
  async checkHealth(): Promise<{ success: boolean; status?: string }> {
    try {
      const response = await apiClient.get('/widget/health');
      return response.data;
    } catch (error) {
      console.error('Failed to check widget health:', error);
      return { success: false };
    }
  },
};
