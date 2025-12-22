import { Message, PlatformAdapter, AIProvider, MCPClient, Intent } from '../types';
import { logger } from '../utils/logger';

/**
 * Message Router
 * Handles incoming messages from all platforms and routes them through the AI and MCP pipeline
 */
export class MessageRouter {
  private adapters: Map<string, PlatformAdapter> = new Map();
  private aiProvider: AIProvider;
  private mcpClient: MCPClient | null;

  constructor(aiProvider: AIProvider, mcpClient: MCPClient | null = null) {
    this.aiProvider = aiProvider;
    this.mcpClient = mcpClient;
  }

  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platform, adapter);
    adapter.onMessage(async (message) => this.handleMessage(message));
    logger.info(`Registered adapter for ${adapter.platform}`);
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      logger.info(`Received message from ${message.platform}: ${message.text}`);

      // Step 1: Process natural language to extract intent
      const intent = await this.aiProvider.processNaturalLanguage(message.text, {
        platform: message.platform,
        userId: message.userId,
        userName: message.userName,
      });

      logger.debug(`Extracted intent:`, intent);

      // Step 2: Execute action based on intent
      let result: any;
      
      if (this.mcpClient && intent.action !== 'error') {
        // Route to MCP server
        const mcpResponse = await this.mcpClient.request({
          method: intent.action,
          params: intent.entities,
          context: {
            platform: message.platform,
            userId: message.userId,
            userName: message.userName,
            chatId: message.chatId,
          },
        });

        result = mcpResponse.success ? mcpResponse.data : { error: mcpResponse.error };
      } else {
        // Fallback: simulated response
        result = this.simulateAction(intent);
      }

      logger.debug(`Action result:`, result);

      // Step 3: Generate natural language response
      const responseText = await this.aiProvider.generateResponse(intent, result, {
        platform: message.platform,
      });

      // Step 4: Send response back to the platform
      await this.sendResponse(message.platform, message.chatId, responseText);

      logger.info(`Sent response to ${message.platform}`);
    } catch (error: any) {
      logger.error(`Error handling message:`, error);
      await this.sendResponse(
        message.platform,
        message.chatId,
        'Sorry, I encountered an error processing your request. Please try again.'
      );
    }
  }

  private simulateAction(intent: Intent): any {
    // Simulated action execution for demo purposes
    switch (intent.action) {
      case 'create':
        return { 
          success: true, 
          id: Date.now().toString(),
          message: `Created ${intent.entities.type || 'item'} successfully`,
          data: intent.entities,
        };
      case 'read':
      case 'query':
      case 'search':
        return {
          success: true,
          results: [
            { id: '1', name: 'Item 1', ...intent.entities },
            { id: '2', name: 'Item 2', ...intent.entities },
          ],
        };
      case 'update':
        return {
          success: true,
          message: `Updated ${intent.entities.type || 'item'} successfully`,
          data: intent.entities,
        };
      case 'delete':
        return {
          success: true,
          message: `Deleted ${intent.entities.type || 'item'} successfully`,
        };
      default:
        return {
          success: false,
          message: `I understand you want to ${intent.action}, but I'm not sure how to help with that yet.`,
        };
    }
  }

  private async sendResponse(platform: string, chatId: string, text: string): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (adapter) {
      await adapter.sendMessage(chatId, text);
    } else {
      logger.error(`No adapter found for platform: ${platform}`);
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down message router...');
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }
  }
}
