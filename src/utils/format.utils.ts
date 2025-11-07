import type { ContextTokensCharts, ContextUserInformation } from '../war/war.types';

export function formatTokensChartsContext(rawContext: ContextTokensCharts[]): string {
  const formattedCharts = rawContext
    .map((tokenChart) => {
      const market = tokenChart.marketInformation;
      return `Market: ${market.name}
Asset: ${market.assetName} / ${market.collateralAssetName}
Price Information:
  - Last Price: ${market.lastPrice}
  - Mark Price: ${market.markPrice}
  - Index Price: ${market.indexPrice}
  - Bid/Ask: ${market.bidPrice} / ${market.askPrice}
  - Daily High: ${market.dailyHigh}
Trading Limits:
  - Min Order Size: ${market.trading.minOrderSize}
  - Min Order Size Change: ${market.trading.minOrderSizeChange}
  - Min Price Change: ${market.trading.minPriceChange}
  - Max Market Order Value: ${market.trading.maxMarketOrderValue}
  - Max Limit Order Value: ${market.trading.maxLimitOrderValue}
  - Max Position Value: ${market.trading.maxPositionValue}
  - Max Leverage: ${market.trading.maxLeverage}
  - Max Number of Orders: ${market.trading.maxNumOrders}
  - Limit Price Cap: ${market.trading.limitPriceCap}
  - Limit Price Floor: ${market.trading.limitPriceFloor}
Current Leverage: ${JSON.stringify(tokenChart.currentLeverage)}
Recent Candles (${tokenChart.candle_charts.length} data points): ${JSON.stringify(tokenChart.candle_charts.slice(-5))}
`;
    })
    .join('\n---\n\n');

  return formattedCharts;
}

export function formatUserInformationContext(rawContext: ContextUserInformation): string {
  const formattedPositions = rawContext.positions
    .map((position) => {
      return `Market: ${position.market}, Side: ${position.side}, Size: ${position.size}, Entry Price: ${position.openPrice}, PnL: ${position.unrealisedPnl}`;
    })
    .join('\n');

  const formattedOrders = rawContext.order
    .map((order) => {
      return `Order ID: ${order.id}, Market: ${order.market}, Side: ${order.side}, Type: ${order.type}, Price: ${order.price}, Qty: ${order.qty}, Status: ${order.status}`;
    })
    .join('\n');

  return `Balance: ${rawContext.balance}\n\nPositions:\n${formattedPositions}\n\nOpen Orders:\n${formattedOrders}`;
}
