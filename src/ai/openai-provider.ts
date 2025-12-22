import OpenAI from 'openai';
import { AIProvider, Intent } from '../types';
import { logger } from '../utils/logger';

/**
 * OpenAI-based AI Provider for natural language processing
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async processNaturalLanguage(text: string, context?: Record<string, any>): Promise<Intent> {
    try {
      const systemPrompt = `You are an AI assistant that processes natural language requests and extracts structured intent.
Analyze the user's message and return a JSON object with:
- action: the main action the user wants to perform (e.g., "create", "read", "update", "delete", "query", "search")
- entities: key-value pairs of relevant information extracted from the message
- confidence: a number between 0 and 1 indicating confidence in the interpretation

Examples:
"Create a new user named John" -> {"action": "create", "entities": {"type": "user", "name": "John"}, "confidence": 0.9}
"Get all orders from last week" -> {"action": "query", "entities": {"type": "orders", "timeframe": "last week"}, "confidence": 0.85}
"Update product price to $50" -> {"action": "update", "entities": {"type": "product", "price": 50}, "confidence": 0.8}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      const intent = JSON.parse(content);
      
      logger.debug('Processed intent from OpenAI:', intent);
      
      return {
        action: intent.action || 'unknown',
        entities: intent.entities || {},
        confidence: intent.confidence || 0.5,
      };
    } catch (error: any) {
      logger.error('OpenAI processing error:', error.message);
      return {
        action: 'error',
        entities: { error: error.message },
        confidence: 0,
      };
    }
  }

  async generateResponse(intent: Intent, data: any, context?: Record<string, any>): Promise<string> {
    try {
      const systemPrompt = `You are a helpful AI assistant that generates natural language responses based on structured data.
The user made a request that resulted in some data. Generate a friendly, conversational response that explains what happened.`;

      const userPrompt = `User's intent: ${JSON.stringify(intent)}
Result data: ${JSON.stringify(data)}
Generate a natural language response.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || 'Request processed successfully.';
    } catch (error: any) {
      logger.error('OpenAI response generation error:', error.message);
      return 'I processed your request, but encountered an issue generating a response.';
    }
  }
}
