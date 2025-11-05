import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the environment schema (only for remaining env vars)
const envSchema = z.object({
  // Starknet Configuration (optional, for MCP server if needed)
  STARKNET_RPC_URL: z.string().optional(),

  // LangSmith Configuration (optional, for tracing)
  LANGSMITH_TRACING: z.string().optional(),
  LANGSMITH_ENDPOINT: z.string().optional(),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates the environment variables and returns the validated config
 * Note: Extended API and model configurations are now loaded from config/extended-war.config.json
 */
export function validateEnv(): EnvConfig {
  try {
    const validated = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    console.log(
      '💡 Note: Extended accounts and models are configured in config/extended-war.config.json'
    );
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error('\nMissing or invalid environment variables:\n');

      error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      });

      console.error('\n💡 Please check your .env file against .env.example');
      console.error('   Make sure all required variables are set with valid values.\n');

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Gets the validated environment config
 * Call this after validateEnv() has been called
 */
export function getEnvConfig(): EnvConfig {
  return envSchema.parse(process.env);
}
