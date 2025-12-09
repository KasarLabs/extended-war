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
 * Starting portfolio value for each agent in USD
 */
export const START_PRICE = 20;

/**
 * Supported tokens for trading
 */
export const tokenSupported = ['BTC-USD', 'ETH-USD', 'EUR-USD'];

/**
 * Trade history for a specific account
 */
export interface HistoryTradeAccount {
  account: AccountConfigWithModel;
  balance: Balance;
  openOrders: OrderReturn[];
  open_positions: Position[];
  positions_history: Position[];
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
  candleCharts: Candle[];
}
