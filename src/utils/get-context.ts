import { tokenSupported } from '../war/war.manager';
import type {
  ContextsFormatted,
  ContextTokensCharts,
  ContextUserInformation,
} from '../war/war.types';
import type { AccountConfigWithModel } from './config-loader';
import { getBalance } from './extended/tools/read/getBalance';
import { getCandlesHistory } from './extended/tools/read/getCandlesHistory';
import { getCurrentLeverage } from './extended/tools/read/getLeverage';
import { getMarkets } from './extended/tools/read/getMarkets';
import { getOpenOrders } from './extended/tools/read/getOpenOrders';
import { getPositions } from './extended/tools/read/getPositions';
import { formatTokensChartsContext, formatUserInformationContext } from './format.utils';

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

export async function getCurrentContext(
  config: AccountConfigWithModel
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
  console.log('User Information:', user_info);
  console.log('Current Open Orders:', open_orders);
  const contextTokenChars: ContextTokensCharts[] = [];
  for (const token of tokenSupported) {
    const market = getMarkets(config.extended, { markets: [token] });
    const current_leverage = await getCurrentLeverage(config.extended, { market: token });
    const candle_history = await getCandlesHistory(config.extended, {
      market: token,
      candleType: 'index-prices',
      interval: '1h',
      limit: 50,
    });
    await Promise.all([market, current_leverage, candle_history]).then((values) => {
      const marketInfo = values[0].data?.filter((m: any) => m.name === token)[0];
      if (!marketInfo) {
        console.warn(`Market information for ${token} not found.`);
        return;
      }
      console.log(`Market Info for ${token}:`, marketInfo);

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

      console.log(`Leverage Info for ${token}:`, values[1].data);
      // console.log(`Candle History for ${token}:`, values[2]);
      contextTokenChars.push({
        marketInformation: market_information!,
        currentLeverage: values[1].data!,
        candle_charts: values[2].data!,
      });
    });
  }
  return {
    userContext: formatUserInformationContext(user_info),
    tokensContext: formatTokensChartsContext(contextTokenChars),
  };
}
