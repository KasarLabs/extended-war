import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getBalance } from '../utils/extended/tools/read/getBalance';
import type {
  ExtendedApiEnv,
  LeverageSetting,
  OrderReturn,
  Position,
} from '../utils/extended/lib/types';
import { getPositions } from '../utils/extended/tools/read/getPositions';
import { getOpenOrders } from '../utils/extended/tools/read/getOpenOrders';
import { getMarkets } from '../utils/extended/tools/read/getMarkets';
import { getCandlesHistory, type Candle } from '../utils/extended/tools/read/getCandlesHistory';
import { formatTokensChartsContext, formatUserInformationContext } from '../utils/format.utils';
import { WarGraph } from './war.graph';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { v4 as uuidv4 } from 'uuid';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { loadConfig, type Config, type ConfigWithModel } from '../utils/config-loader';
import type { MarketInformation } from '../utils/get-context';
import { initializeModels } from '../utils/model.utils';
import type { getTradesHistory } from '../utils/extended/tools/read/getTradesHistory';

export const tokenSupported = ['BTC-USD', 'ETH-USD', 'EUR-USD'];

export interface ContextsFormatted {
  userContext: string;
  tokensContext: string;
}

export interface ContextUserInformation {
  balance: string;
  positions: Position[];
  order: OrderReturn[];
}
export interface ContextTokensCharts {
  marketInformation: MarketInformation;
  currentLeverage: LeverageSetting[];
  candle_charts: Candle[];
}

export class ExtendedWarManager {
  private static instance: ExtendedWarManager | null = null;
  private static initialized: boolean = false;
  private config: ConfigWithModel;
  private graph: CompiledStateGraph<any, any, any, any, any> | undefined;
  private warGraphInstance: WarGraph | undefined;
  private signal: AbortController;

  private constructor(config: Config) {
    const accountWithModel = [];
    for (const account of config.accounts) {
      const model = initializeModels(account.model);
      const mcpClient = new Client({ name: 'war-extended-mcp-client', version: '1.0.0' });
      accountWithModel.push({ ...account, model, mcpClient });
    }
    this.config = { accounts: accountWithModel };
    this.signal = new AbortController();
  }

  /** Get singleton instance */
  public static getInstance(): ExtendedWarManager {
    if (!ExtendedWarManager.instance) {
      const config = loadConfig();
      ExtendedWarManager.instance = new ExtendedWarManager(config);
    }
    return ExtendedWarManager.instance;
  }

  public async init(): Promise<void> {
    if (ExtendedWarManager.initialized) {
      console.log('ExtendedWarManager is already initialized.');
      return;
    }
    await this.connectToServer();
    const warGraph = new WarGraph(this.config);
    this.warGraphInstance = warGraph;
    this.graph = warGraph.getGraph();
    ExtendedWarManager.initialized = true;
  }

  private async connectToServer() {
    try {
      for (const account of this.config.accounts) {
        const transport = new StdioClientTransport({
          command: 'node',
          args: ['../ask-starknet/packages/mcp/build/index.js'],
          env: {
            STARKNET_RPC_URL: process.env.STARKNET_RPC_URL as string,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY as string,
            EXTENDED_API_URL: account.extended.apiUrl,
            EXTENDED_API_KEY: account.extended.apiKey,
            EXTENDED_PRIVATE_KEY: account.extended.privateKey,
            NODE_ENV: 'local',
          },
        });
        account.mcpClient.connect(transport);
        console.log('Connected to MCP server successfully.');
      }
    } catch (e) {
      console.log('Failed to connect to MCP server: ', e);
      throw e;
    }
  }

  public async execute(): Promise<void> {
    if (!this.graph || !this.warGraphInstance) {
      throw new Error('WarGraph is not initialized. Call init() first.');
    }

    const thread_id = uuidv4();
    while (this.signal.signal.aborted === false) {
      await this.graph.invoke('', {
        configurable: { thread_id },
      });

      console.log('WarGraph execution cycle completed. Waiting for next cycle...');
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before next cycle
    }
    console.log('War execution completed.');
    return;
  }

  public stop(): void {
    this.signal.abort();
    console.log('War execution stopped.');
  }

  public getTradesHistory() {
    const tradeHistory = [];
    for (const account of this.config.accounts) {
    }
  }
}

export default ExtendedWarManager.getInstance();
