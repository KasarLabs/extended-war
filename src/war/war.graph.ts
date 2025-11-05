import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { MemorySaver, type CompiledStateGraph } from '@langchain/langgraph';
import { END, StateGraph } from '@langchain/langgraph';
import { START, Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from 'langchain';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { EXTENDED_AGENT_PROMPT } from '../prompt/prompt';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { send_operation_tool, wait_tool } from '../tools/extended-war.tools';
import type { AccountConfigWithModel, ConfigWithModel } from '../utils/config-loader';
import { getCurrentContext } from '../utils/get-context';
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
  constructor(config: ConfigWithModel) {
    this.config = config;
    this.init();
  }

  private async callModel(state: typeof StateAnnotation.State, account: AccountConfigWithModel) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', EXTENDED_AGENT_PROMPT],
      ['human', 'start your job.'],
    ]);
    const context = await getCurrentContext(account);
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
        const toolResponse = account.mcpClient.callTool({
          name: 'ask_starknet',
          arguments: {
            userInput: JSON.stringify(toolCall.args),
            rawTools: true,
          },
        });
        console.log('Tool responses processed.');
        console.log(toolResponse);
      }
    }
    return {
      ...state,
      messages: response,
    };
  }

  private init() {
    const graphBuilder = new StateGraph(StateAnnotation);

    this.config.accounts.forEach((account, index) => {
      const nodeKey = `agent_${account.name}_${index}` as const;

      const callModelWithSpecificModel = async (state: typeof StateAnnotation.State) => {
        return this.callModel(state, account);
      };

      graphBuilder
        .addNode(nodeKey, callModelWithSpecificModel)
        .addEdge(START, nodeKey)
        .addEdge(nodeKey, END);
    });

    this.checkpointer = new MemorySaver();
    this.graph = graphBuilder.compile({ checkpointer: this.checkpointer });
  }

  public getGraph(): CompiledStateGraph<any, any, any, any, any> | undefined {
    return this.graph;
  }
}
