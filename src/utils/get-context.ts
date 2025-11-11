import { th } from 'zod/v4/locales';
import { tokenSupported } from '../war/war.manager.js';
import type {
  ContextsFormatted,
  ContextTokensCharts,
  ContextUserInformation,
} from '../war/war.types.js';
import type { AccountConfigWithModel } from './config-loader.js';
import { getBalance } from './extended/tools/read/getBalance.js';
import { getCandlesHistory, type Candle } from './extended/tools/read/getCandlesHistory.js';
import { getCurrentLeverage } from './extended/tools/read/getLeverage.js';
import { getMarkets, type MarketInfo } from './extended/tools/read/getMarkets.js';
import { getOpenOrders } from './extended/tools/read/getOpenOrders.js';
import { getPositions } from './extended/tools/read/getPositions.js';
import { formatTokensChartsContext, formatUserInformationContext } from './format.utils.js';

export interface MarketInformation {
  name: string;
  assetName: string;
  collateralAssetName: string;
  dailyHigh: string;
  lastPrice: string;
  askPrice: string;
  bidPrice: string;
  markPrice: string;
  indexPrice: string;
  trading: TradingLimits;
}

export interface TradingLimits {
  minOrderSize: string;
  minOrderSizeChange: string;
  minPriceChange: string;
  maxMarketOrderValue: string;
  maxLimitOrderValue: string;
  maxPositionValue: string;
  maxLeverage: string;
  maxNumOrders: string;
  limitPriceCap: string;
  limitPriceFloor: string;
}

export interface MarketContext {
  token: string;
  marketInfo: MarketInfo;
  candleHistory: Candle[];
}

export async function getCurrentMarketInfo(
  defaultConfig: AccountConfigWithModel
): Promise<MarketContext[]> {
  try {
    const markets = await getMarkets(defaultConfig.extended, { markets: tokenSupported });
    if (markets.status === 'failure' || !markets.data) {
      throw new Error(`Failed to get markets: ${markets.error}`);
    }
    await getMarkets(defaultConfig.extended, { markets: ['BTC-USD'] }).then((res) => {
      if (!res.data) {
        throw new Error(`Failed to get BTC-USD market: ${res.error}`);
      }
      const btc = res.data.filter((market) => market.name === 'BTC-USD')[0];
      markets.data?.push(btc);
    });

    console.log('Fetched Markets:', markets.data.length);
    const candleHistoryMap = new Map<string, Candle[]>();

    for (const token of tokenSupported) {
      const response = await getCandlesHistory(defaultConfig.extended, {
        market: token,
        candleType: 'index-prices',
        interval: '1h',
        limit: 50,
      });

      if (!response || !response.data || response.status === 'failure') {
        console.error(`Failed to get candle history for ${token}:`, response.error);
        candleHistoryMap.set(token, []);
        continue;
      }
      candleHistoryMap.set(token, response.data || []);
    }
    // Now map correctly using the token name
    const marketContexts: MarketContext[] = markets.data
      .filter((market) => tokenSupported.includes(market.name))
      .map((market) => ({
        token: market.name,
        marketInfo: market,
        candleHistory: candleHistoryMap.get(market.name) || [],
      }));

    return marketContexts;
  } catch (error) {
    throw new Error(`Failed to get market information: ${error}`);
  }
}

export async function getCurrentAccountContext(
  config: AccountConfigWithModel,
  currentMarket: MarketContext[]
): Promise<ContextsFormatted> {
  const balance = getBalance(config.extended, {});
  const positions = getPositions(config.extended, {});
  const open_orders = getOpenOrders(config.extended, {});

  const values = await Promise.all([balance, positions, open_orders]);
  const user_info: ContextUserInformation = {
    balance: values[0].data?.balance || '0',
    positions: values[1].data || [],
    order: values[2].data || [],
  };
  const contextTokenChars: ContextTokensCharts[] = [];
  for (const token of tokenSupported) {
    const current_leverage = await getCurrentLeverage(config.extended, { market: token });
    await Promise.all([current_leverage]).then((values) => {
      const marketInfo = currentMarket.find((market) => market.token === token)?.marketInfo;
      if (!marketInfo) {
        console.error(`Market information not found for token: ${token}`);
        return;
      }
      // Create market_information matching MarketInformation interface
      const market_information: MarketInformation = {
        name: marketInfo.name,
        assetName: marketInfo.assetName,
        collateralAssetName: marketInfo.collateralAssetName,
        dailyHigh: marketInfo.marketStats.dailyHigh,
        lastPrice: marketInfo.marketStats.lastPrice,
        askPrice: marketInfo.marketStats.askPrice,
        bidPrice: marketInfo.marketStats.bidPrice,
        markPrice: marketInfo.marketStats.markPrice,
        indexPrice: marketInfo.marketStats.indexPrice,
        trading: {
          minOrderSize: marketInfo.tradingConfig.minOrderSize,
          minOrderSizeChange: marketInfo.tradingConfig.minOrderSizeChange,
          minPriceChange: marketInfo.tradingConfig.minPriceChange,
          maxMarketOrderValue: marketInfo.tradingConfig.maxMarketOrderValue,
          maxLimitOrderValue: marketInfo.tradingConfig.maxLimitOrderValue,
          maxPositionValue: marketInfo.tradingConfig.maxPositionValue,
          maxLeverage: marketInfo.tradingConfig.maxLeverage,
          maxNumOrders: marketInfo.tradingConfig.maxNumOrders,
          limitPriceCap: marketInfo.tradingConfig.limitPriceCap,
          limitPriceFloor: marketInfo.tradingConfig.limitPriceFloor,
        },
      };
      if (!values[0].data) {
        throw new Error(`Failed to get leverage info for ${token}`);
      }

      const candleChartes = currentMarket.find((market) => market.token === token)?.candleHistory;
      if (!candleChartes) {
        throw new Error(`Failed to get candle history for ${token}`);
      }
      // console.log(`Candle History for ${token}:`, values[2]);
      contextTokenChars.push({
        marketInformation: market_information!,
        currentLeverage: values[0].data!,
        candleCharts: candleChartes,
      });
    });
  }
  return {
    userContext: formatUserInformationContext(user_info),
    tokensContext: formatTokensChartsContext(contextTokenChars),
  };
}
