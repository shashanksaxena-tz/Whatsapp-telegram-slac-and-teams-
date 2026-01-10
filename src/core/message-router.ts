import { Message, PlatformAdapter, AIProvider, MCPClient, Intent } from '../types';
import { logger } from '../utils/logger';
import { SentimentAnalyzer } from '../ai/sentiment-analyzer';
import { VectorMemoryService } from '../ai/vector-memory';

/**
 * Message Router
 * Handles incoming messages from all platforms and routes them through the AI and MCP pipeline
 */
export class MessageRouter {
  private adapters: Map<string, PlatformAdapter> = new Map();
  private aiProvider: AIProvider;
  private mcpClient: MCPClient | null;
  private sentimentAnalyzer: SentimentAnalyzer;
  private vectorMemory: VectorMemoryService | null = null;
  private vectorMemoryInitialized: boolean = false;

  constructor(
    aiProvider: AIProvider, 
    mcpClient: MCPClient | null = null,
    enableVectorMemory: boolean = false
  ) {
    this.aiProvider = aiProvider;
    this.mcpClient = mcpClient;
    this.sentimentAnalyzer = new SentimentAnalyzer();
    
    if (enableVectorMemory) {
      this.vectorMemory = new VectorMemoryService();
      // Initialize asynchronously but don't block constructor
      this.initializeVectorMemory();
    }
  }

  private async initializeVectorMemory(): Promise<void> {
    if (this.vectorMemory) {
      try {
        await this.vectorMemory.initialize();
        this.vectorMemoryInitialized = true;
        logger.info('Vector memory initialized successfully');
      } catch (error) {
        logger.warn('Vector memory initialization failed:', error);
        this.vectorMemory = null;
      }
    }
  }

  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platform, adapter);
    adapter.onMessage(async (message) => this.handleMessage(message));
    logger.info(`Registered adapter for ${adapter.platform}`);
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      logger.info(`Received message from ${message.platform}: ${message.text}`);

      // Step 0: Analyze sentiment
      const sentiment = this.sentimentAnalyzer.analyze(message.text);
      logger.debug(`Sentiment analysis:`, sentiment);

      // Check if escalation is needed
      if (sentiment.shouldEscalate) {
        const escalationReason = this.sentimentAnalyzer.getEscalationReason(sentiment);
        logger.warn(`Message requires escalation: ${escalationReason}`);
        
        // Send escalation notice
        await this.sendResponse(
          message.platform,
          message.chatId,
          'I understand you\'re having difficulties. Let me connect you with a human representative who can better assist you.'
        );
        // In production, this would route to a human agent
        return;
      }

      // Store message in vector memory if enabled and initialized
      if (this.vectorMemory && this.vectorMemoryInitialized) {
        try {
          await this.vectorMemory.storeMessage({
            id: `${message.platform}-${message.id}`,
            text: message.text,
            metadata: {
              userId: message.userId,
              platform: message.platform,
              timestamp: message.timestamp.getTime(),
              sentiment: sentiment.sentiment,
              emotion: sentiment.emotion
            }
          });
        } catch (error) {
          logger.warn('Failed to store message in vector memory:', error);
        }
      }

      // Get conversation context from vector memory
      let context = {};
      if (this.vectorMemory && this.vectorMemoryInitialized) {
        try {
          const memoryContext = await this.vectorMemory.getConversationContext(
            message.text,
            message.userId,
            message.platform
          );
          context = { conversationHistory: memoryContext.contextText };
        } catch (error) {
          logger.warn('Failed to retrieve conversation context:', error);
        }
      }

      // Step 1: Process natural language to extract intent
      const intent = await this.aiProvider.processNaturalLanguage(message.text, {
        platform: message.platform,
        userId: message.userId,
        userName: message.userName,
        sentiment: sentiment.sentiment,
        emotion: sentiment.emotion,
        ...context
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
            sentiment: sentiment.sentiment,
            emotion: sentiment.emotion
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
        sentiment: sentiment.sentiment,
        emotion: sentiment.emotion
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

  /**
   * Public method to send a message through a platform adapter
   * Used by API endpoints to send messages programmatically
   */
  async sendMessage(platform: string, chatId: string, text: string, metadata?: Record<string, any>): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Platform adapter not found or not enabled: ${platform}`);
    }
    await adapter.sendMessage(chatId, text, metadata);
    logger.info(`Message sent to ${platform} chat ${chatId}`);
  }

  /**
   * Get list of registered platform adapters
   */
  getRegisteredPlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Analyze sentiment of a text
   */
  analyzeSentiment(text: string) {
    return this.sentimentAnalyzer.analyze(text);
  }

  /**
   * Get vector memory service
   */
  getVectorMemory(): VectorMemoryService | null {
    return this.vectorMemory;
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
