import type { AccountConfigWithModel } from '../utils/config-loader';
import type {
  Balance,
  LeverageSetting,
  OrderReturn,
  Position,
  Trade,
} from '../utils/extended/lib/types';
import type { Candle } from '../utils/extended/tools/read/getCandlesHistory';
import type { MarketInformation } from '../utils/get-context';

/**
 * Supported tokens for trading
 */
export const tokenSupported = ['BTC-USD', 'ETH-USD', 'EUR-USD'] as const;

/**
 * Trade history for a specific account
 */
export interface HistoryTradeAccount {
  account: AccountConfigWithModel;
  balance: Balance;
  openOrders: OrderReturn[];
  positions: Position[];
  trade: Trade[];
}

/**
 * Formatted contexts for user and tokens
 */
export interface ContextsFormatted {
  userContext: string;
  tokensContext: string;
}

/**
 * User information context
 */
export interface ContextUserInformation {
  balance: string;
  positions: Position[];
  order: OrderReturn[];
}

/**
 * Token charts context
 */
export interface ContextTokensCharts {
  marketInformation: MarketInformation;
  currentLeverage: LeverageSetting[];
  candle_charts: Candle[];
}
