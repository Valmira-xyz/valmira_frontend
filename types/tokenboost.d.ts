// TypeScript declarations for TokenBoost SDK

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

// interface StrategyData {
//   id: string;
//   type: string;
//   token: TokenData;
//   budget: number;
//   duration: number;
// }

interface ValmiraTokenBoostAPI {
  // Core functions
  open(): void;
  close(): void;

  // Configuration
  setTokens(tokens: TokenData | TokenData[]): void;
  updateConfig(
    config: Partial<{
      primaryColor: string;
      theme: string;
      position: string;
    }>
  ): void;

  // Event system
  on(eventName: string, callback: (data: any) => void): void;
  off(eventName: string, callback: (data: any) => void): void;

  // State getters
  isOpen(): boolean;
  isReady(): boolean;
  getConfig(): any;
  getTokens(): TokenData[];

  // SDK management
  isSDKReady(): boolean;
  validateConfig(): { valid: boolean; missing: string[] };
  cleanup(): boolean;

  // Analytics
  getAnalytics(): any;
  trackCustomEvent(eventName: string, data: any): void;

  // Utility
  version: string;
}

declare global {
  interface Window {
    ValmiraTokenBoost?: ValmiraTokenBoostAPI;
    valmiraDetectedTokens?: TokenData[];
    ValmiraTokenBoostTimers?: number[];
    ValmiraTokenBoostDebug?: any;
    gc?: () => void;
  }
}

export {};
