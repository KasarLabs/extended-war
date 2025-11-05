import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export interface ModelConfig {
  provider: string;
  modelName: string;
  apiKey: string;
}

/**
 * Initializes model instances based on the loaded configuration.
 * @throws {Error} If models configuration is not loaded.
 */
export function initializeModels(model: ModelConfig): BaseChatModel {
  try {
    if (!model) {
      throw new Error('Model configuration is not defined');
    }
    let modelInstance: BaseChatModel | null = null;
    const commonConfig = {
      modelName: model.modelName,
      verbose: false,
    };
    switch (model.provider.toLowerCase()) {
      case 'openai':
        modelInstance = new ChatOpenAI({
          ...commonConfig,
          openAIApiKey: model.apiKey,
        });
        break;
      case 'anthropic':
        modelInstance = new ChatAnthropic({
          ...commonConfig,
          anthropicApiKey: model.apiKey,
        });
        break;
      case 'gemini':
        modelInstance = new ChatGoogleGenerativeAI({
          model: model.modelName,
          verbose: false,
          apiKey: model.apiKey,
        });
        break;
      // Add case for 'deepseek' if a Langchain integration exists or becomes available
      default:
        throw new Error('No valid model provided');
    }
    return modelInstance;
  } catch (error) {
    console.error('Error initializing model:', error);
    throw error;
  }
}
