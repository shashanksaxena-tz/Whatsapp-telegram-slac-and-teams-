import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, Intent } from '../types';
import { logger } from '../utils/logger';

/**
 * Anthropic Claude-based AI Provider for natural language processing
 */
export class AnthropicProvider implements AIProvider {
  private client: any;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async processNaturalLanguage(text: string, context?: Record<string, any>): Promise<Intent> {
    try {
      const systemPrompt = `You are an AI assistant that processes natural language requests and extracts structured intent.
Analyze the user's message and return a JSON object with:
- action: the main action the user wants to perform (e.g., "create", "read", "update", "delete", "query", "search")
- entities: key-value pairs of relevant information extracted from the message
- confidence: a number between 0 and 1 indicating confidence in the interpretation

Return ONLY valid JSON, no other text.`;

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { 
            role: 'user', 
            content: `${systemPrompt}\n\nUser message: "${text}"\n\nReturn the JSON intent:` 
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const intent = JSON.parse(content);
      
      logger.debug('Processed intent from Anthropic:', intent);
      
      return {
        action: intent.action || 'unknown',
        entities: intent.entities || {},
        confidence: intent.confidence || 0.5,
      };
    } catch (error: any) {
      logger.error('Anthropic processing error:', error.message);
      return {
        action: 'error',
        entities: { error: error.message },
        confidence: 0,
      };
    }
  }

  async generateResponse(intent: Intent, data: any, context?: Record<string, any>): Promise<string> {
    try {
      const prompt = `You are a helpful AI assistant. The user made a request with the following intent:
${JSON.stringify(intent)}

The system processed it and returned:
${JSON.stringify(data)}

Generate a friendly, conversational response that explains what happened to the user. Be concise and clear.`;

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt },
        ],
      });

      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Request processed successfully.';
    } catch (error: any) {
      logger.error('Anthropic response generation error:', error.message);
      return 'I processed your request, but encountered an issue generating a response.';
    }
  }
}
