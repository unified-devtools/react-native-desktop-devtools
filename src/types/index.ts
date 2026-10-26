export type TabType = 'logs' | 'network' | 'queries' | 'custom';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'other';
  osVersion: string;
  address: string;
  connectedAt: number;
}

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: any[];
  timestamp: number;
  stack?: string;
}

export interface NetworkEntry {
  id: string;
  url: string;
  method: string;
  status: number;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseHeaders: Record<string, string>;
  responseBody?: any;
  durationMs: number;
  timestamp: number;
  isMocked?: boolean;
}

export interface MockRule {
  id: string;
  urlPattern: string;
  method: string;
  statusCode: number;
  delayMs: number;
  responseBody: string; // JSON string
  enabled: boolean;
}

export interface QueryEntry {
  key: string;
  queryHash?: string;
  status: 'fetching' | 'stale' | 'fresh' | 'error' | 'paused' | 'inactive';
  data?: any;
  updatedAt: number;
  observersCount?: number;
  state?: {
    status?: string;
    fetchStatus?: string;
    error?: any;
    dataUpdatedAt?: number;
    errorUpdatedAt?: number;
    fetchFailureCount?: number;
    isInvalidated?: boolean;
  };
  options?: {
    gcTime?: number;
    staleTime?: number;
    retry?: any;
  };
}

export interface CustomPluginColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'timestamp' | 'badge' | 'json';
}

export interface CustomPluginAction {
  id: string;
  label: string;
  icon?: string;
}

export interface CustomPluginSchema {
  id: string;
  title: string;
  icon?: string;
  columns: CustomPluginColumn[];
  actions: CustomPluginAction[];
}
