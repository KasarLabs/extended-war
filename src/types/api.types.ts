import type { Balance, OrderReturn, Position, Trade } from '../utils/extended/lib/types';

/**
 * Cleaned account data for API response (without circular references)
 */
export interface CleanAccountData {
  account: {
    name: string;
    extended: {
      apiUrl: string;
      apiKey: string;
      privateKey: string;
    };
  };
  balance: Balance;
  openOrders: OrderReturn[];
  open_positions: Position[];
  positions_history: Position[];
}

/**
 * Base API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Start war response data
 */
export interface StartWarResponseData {
  status: 'started' | 'already_running';
  startedAt: string;
}

/**
 * End war response data
 */
export interface EndWarResponseData {
  status: 'stopped';
  stoppedAt: string;
}

/**
 * Trade history response data
 */
export interface TradeHistoryResponseData {
  accounts: CleanAccountData[];
  startPrice: number;
  timestamp: string;
}

/**
 * Health check response data
 */
export interface HealthCheckResponseData {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

/**
 * War running status response data
 */
export interface WarRunningStatusResponseData {
  isRunning: boolean;
  timestamp: string;
}
