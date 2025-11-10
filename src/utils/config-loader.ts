import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

// Define the schema for the configuration
const AccountConfigSchema = z.object({
  name: z.string(),
  extended: z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().min(1),
    privateKey: z.string().min(1),
  }),
  model: z.object({
    provider: z.enum(['anthropic', 'openai', 'gemini', 'groq']),
    modelName: z.string().min(1),
    apiKey: z.string().min(1), // Direct API key value
  }),
});

const ConfigSchema = z.object({
  accounts: z.array(AccountConfigSchema).min(1, 'At least one account must be configured'),
});

export type AccountConfig = z.infer<typeof AccountConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

// Type without model configuration (only Extended API info)
export type AccountConfigWithoutModel = Omit<AccountConfig, 'model'>;
export type ConfigWithoutModel = {
  accounts: AccountConfigWithoutModel[];
};

// Type with BaseChatModel instance instead of model config
export type AccountConfigWithModel = Omit<AccountConfig, 'model'> & {
  model: BaseChatModel;
  mcpClient: Client;
};
export type ConfigWithModel = {
  accounts: AccountConfigWithModel[];
};

/**
 * Loads and validates the configuration from the JSON file
 * @param configPath - Optional path to the config file. Defaults to config/extended-war.config.json
 * @returns Validated configuration object
 */
export function loadConfig(configPath?: string): Config {
  try {
    const defaultPath = join(process.cwd(), 'config', 'extended-war.config.json');
    const path = configPath || defaultPath;

    const fileContent = readFileSync(path, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);

    // Validate the configuration
    const validatedConfig = ConfigSchema.parse(parsedConfig);

    console.log(
      `✅ Configuration loaded successfully with ${validatedConfig.accounts.length} account(s)`
    );

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      console.error('\nInvalid configuration structure:\n');

      error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      });

      console.error('\n💡 Please check your config/extended-war.config.json file');
      console.error('   Make sure all required fields are present and valid.\n');

      process.exit(1);
    }

    if (error instanceof SyntaxError) {
      console.error('❌ Invalid JSON in configuration file');
      console.error(error.message);
      process.exit(1);
    }

    console.error('❌ Error loading configuration:', error);
    throw error;
  }
}
