import { randomUUID } from 'node:crypto';
import { getBalance } from '../utils/extended/tools/read/getBalance';
import type { Balance, OrderReturn, Position, Trade } from '../utils/extended/lib/types';
import { getPositions } from '../utils/extended/tools/read/getPositions';
import { getOpenOrders } from '../utils/extended/tools/read/getOpenOrders';
import { WarGraph } from './war.graph';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { loadConfig, type Config, type ConfigWithModel } from '../utils/config-loader';
import { initializeModels } from '../utils/model.utils';
import { getTradesHistory } from '../utils/extended/tools/read/getTradesHistory';
import type { HistoryTradeAccount } from './war.types';
export { tokenSupported } from './war.types';

export class ExtendedWarManager {
  private static instance: ExtendedWarManager | null = null;
  private static initialized: boolean = false;
  private running: boolean = false;
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

    if (this.signal.signal.aborted === true) {
      this.signal = new AbortController();
    }
    const thread_id = randomUUID();
    this.running = true;
    while (this.signal.signal.aborted === false) {
      await this.graph.invoke('', {
        configurable: { thread_id },
      });

      console.log('WarGraph execution cycle completed. Waiting for next cycle...');
      const cycleTimeout = Number.parseInt(process.env.WAR_CYCLE_TIMEOUT_MS || '10000', 10);
      await new Promise((resolve) => setTimeout(resolve, cycleTimeout));
    }
    this.running = false;
    console.log('War execution completed.');
    return;
  }

  public stop(): void {
    this.signal.abort();
    console.log('War execution stopped.');
  }

  public async getTradesHistory(): Promise<HistoryTradeAccount[]> {
    const tradeHistory: HistoryTradeAccount[] = [];
    for (const account of this.config.accounts) {
      const accountBalance = await getBalance(
        {
          apiUrl: account.extended.apiUrl as string,
          apiKey: account.extended.apiKey as string,
          privateKey: account.extended.privateKey as string,
        },
        {}
      );
      const openOrders = await getOpenOrders(
        {
          apiUrl: account.extended.apiUrl as string,
          apiKey: account.extended.apiKey as string,
          privateKey: account.extended.privateKey as string,
        },
        {}
      );
      const positions = await getPositions(
        {
          apiUrl: account.extended.apiUrl as string,
          apiKey: account.extended.apiKey as string,
          privateKey: account.extended.privateKey as string,
        },
        {}
      );
      const trade = await getTradesHistory(
        {
          apiUrl: account.extended.apiUrl as string,
          apiKey: account.extended.apiKey as string,
          privateKey: account.extended.privateKey as string,
        },
        {}
      );
      if (accountBalance.error || openOrders.error || positions.error || trade.error) {
        console.log(
          `Error fetching trade history for account ${account.name}:`,
          accountBalance.error || openOrders.error || positions.error || trade.error
        );
        continue;
      }
      tradeHistory.push({
        account,
        balance: accountBalance.data as Balance,
        openOrders: openOrders.data as OrderReturn[],
        positions: positions.data as Position[],
        trade: trade.data as Trade[],
      });
    }
    return tradeHistory;
  }
  public isRunning(): boolean {
    return this.running;
  }
}

export default ExtendedWarManager.getInstance();
