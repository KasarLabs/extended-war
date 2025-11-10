import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { MemorySaver, type CompiledStateGraph } from '@langchain/langgraph';
import { END, StateGraph } from '@langchain/langgraph';
import { START, Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from 'langchain';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { EXTENDED_AGENT_PROMPT } from '../prompt/prompt';
import { send_operation_tool, wait_tool } from '../tools/extended-war.tools';
import type { AccountConfigWithModel, ConfigWithModel } from '../utils/config-loader';
import {
  getCurrentAccountContext,
  getCurrentMarketInfo,
  type MarketContext,
} from '../utils/get-context';
import { get } from 'http';
import type { MarketInfo } from '../utils/extended/tools/read/getMarkets';
import { logger } from 'starknet';
const StateAnnotation = Annotation.Root({
  sentiment: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});
export class WarGraph {
  private graph: CompiledStateGraph<any, any, any, any, any> | undefined;
  private checkpointer: MemorySaver | undefined;
  private config: ConfigWithModel;
  private marketInfo: MarketContext[] = [];
  constructor(config: ConfigWithModel) {
    this.config = config;
    this.init();
  }

  private async fetchMarketInfo() {
    console.info('Fetching market information for default account...');
    if (this.config.accounts.length === 0) {
      throw new Error('No accounts available to fetch market info.');
    }
    const defaultAccount = this.config.accounts[0];
    const marketContexts = await getCurrentMarketInfo(defaultAccount);
    this.marketInfo = marketContexts;
  }

  private async callModel(state: typeof StateAnnotation.State, account: AccountConfigWithModel) {
    const startTime = Date.now();
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    console.info(`\n🤖 [${timestamp}] Calling model for account: ${account.name}`);
    if (!this.marketInfo || this.marketInfo.length === 0) {
      throw new Error(
        'Market information is not available. Ensure fetchMarketInfo is called first.'
      );
    }
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', EXTENDED_AGENT_PROMPT],
      ['human', 'start your job.'],
    ]);
    const context = await getCurrentAccountContext(account, this.marketInfo);
    const systemPrompt = await prompt.formatMessages({
      current_positions: context.userContext,
      current_prices: context.tokensContext,
      model: account.model.name,
    });
    const bindModel = account.model.bindTools!([send_operation_tool, wait_tool]);
    const response = await bindModel.invoke(systemPrompt);
    console.log(`Model Response from ${account.name}:`, response.content);
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        if (toolCall.name != 'send_operation') continue;
        console.log('Processing tool call:', toolCall.name);
        const toolResponse = await account.mcpClient.callTool({
          name: 'ask_starknet',
          arguments: {
            userInput: JSON.stringify(toolCall.args),
            rawTools: true,
          },
        });
        console.log('Tool response:', JSON.stringify(toolResponse, null, 2));
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const endTimestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    console.info(
      `✅ [${endTimestamp}] Model call completed for ${account.name} - Duration: ${duration}s\n`
    );

    return {
      ...state,
      messages: response,
    };
  }

  private init() {
    const graphBuilder = new StateGraph(StateAnnotation);
    const fetchMarketInfoKey = 'fetchMarketInfo' as const;
    graphBuilder
      .addNode(fetchMarketInfoKey, this.fetchMarketInfo.bind(this))
      .addEdge(START, fetchMarketInfoKey);

    this.config.accounts.forEach((account, index) => {
      const nodeKey = `agent_${account.name}_${index}` as const;

      const callModelWithSpecificModel = async (state: typeof StateAnnotation.State) => {
        return this.callModel(state, account);
      };
      graphBuilder
        .addNode(nodeKey, callModelWithSpecificModel.bind(this))
        .addEdge(fetchMarketInfoKey as any, nodeKey)
        .addEdge(nodeKey, END);
    });

    this.checkpointer = new MemorySaver();
    this.graph = graphBuilder.compile({ checkpointer: this.checkpointer });
  }

  public getGraph(): CompiledStateGraph<any, any, any, any, any> | undefined {
    return this.graph;
  }
}
