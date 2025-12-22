import { AIProvider } from '../types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { config } from '../utils/config';

export function createAIProvider(): AIProvider {
  if (config.aiProvider === 'anthropic' && config.anthropicApiKey) {
    return new AnthropicProvider(config.anthropicApiKey);
  } else if (config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey);
  } else {
    throw new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env');
  }
}

export { OpenAIProvider } from './openai-provider';
export { AnthropicProvider } from './anthropic-provider';
