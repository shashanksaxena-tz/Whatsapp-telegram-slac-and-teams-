import {
  BotFrameworkAdapter,
  TurnContext,
  ActivityTypes,
  Activity,
} from 'botbuilder';
import { PlatformAdapter, Platform, Message } from '../types';
import { logger } from '../utils/logger';
import express, { Request, Response } from 'express';

/**
 * Microsoft Teams Platform Adapter using Bot Framework
 */
export class TeamsAdapter implements PlatformAdapter {
  public readonly platform = Platform.TEAMS;
  private adapter: BotFrameworkAdapter | null = null;
  private messageHandler?: (message: Message) => Promise<void>;
  private server?: express.Application;

  constructor(
    private appId: string,
    private appPassword: string
  ) {}

  async initialize(): Promise<void> {
    this.adapter = new BotFrameworkAdapter({
      appId: this.appId,
      appPassword: this.appPassword,
    });

    // Error handler
    this.adapter.onTurnError = async (context, error) => {
      logger.error('Teams adapter error:', error);
      await context.sendActivity('Sorry, an error occurred processing your message.');
    };

    logger.info('Teams adapter initialized');
  }

  setupEndpoint(app: express.Application, path: string = '/api/teams/messages'): void {
    this.server = app;
    
    app.post(path, async (req: Request, res: Response) => {
      if (!this.adapter) {
        res.status(500).send('Teams adapter not initialized');
        return;
      }

      await this.adapter.processActivity(req, res, async (context: TurnContext) => {
        if (context.activity.type === ActivityTypes.Message && context.activity.text) {
          if (this.messageHandler) {
            const message: Message = {
              id: context.activity.id || Date.now().toString(),
              platform: Platform.TEAMS,
              userId: context.activity.from.id,
              userName: context.activity.from.name,
              chatId: context.activity.conversation.id,
              text: context.activity.text,
              timestamp: new Date(context.activity.timestamp || Date.now()),
              metadata: {
                conversationType: context.activity.conversation.conversationType,
                channelId: context.activity.channelId,
              },
            };

            await this.messageHandler(message);
          }
        }
      });
    });

    logger.info(`Teams webhook endpoint setup at ${path}`);
  }

  async sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.adapter) {
      throw new Error('Teams adapter not initialized');
    }

    // Note: Microsoft Teams sending requires storing conversation references
    // This is a simplified implementation. In production, you should:
    // 1. Store conversation references when receiving messages
    // 2. Use the stored reference to continue the conversation
    // 3. Use the BotFrameworkAdapter.continueConversation method
    
    logger.warn('Teams sendMessage is not fully implemented - requires conversation reference storage');
    logger.debug(`Would send Teams message to ${chatId}: ${message}`);
    
    // TODO: Implement proper conversation reference storage and retrieval
    // For now, this is a placeholder that logs the intent
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    this.adapter = null;
    logger.info('Teams adapter disconnected');
  }
}
