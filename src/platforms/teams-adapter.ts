import {
  BotFrameworkAdapter,
  TurnContext,
  ActivityTypes,
  Activity,
  ConversationReference,
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
  private conversationReferences: Map<string, Partial<ConversationReference>> = new Map();

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
        if (context.activity.type === ActivityTypes.Message) {
          const conversationReference = TurnContext.getConversationReference(context.activity);
          const chatId = context.activity.conversation.id;

          // Store the conversation reference for later use
          this.conversationReferences.set(chatId, conversationReference);

          if (context.activity.text) {
            if (this.messageHandler) {
              const message: Message = {
                id: context.activity.id || Date.now().toString(),
                platform: Platform.TEAMS,
                userId: context.activity.from.id,
                userName: context.activity.from.name,
                chatId: chatId,
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
        }
      });
    });

    logger.info(`Teams webhook endpoint setup at ${path}`);
  }

  async sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.adapter) {
      throw new Error('Teams adapter not initialized');
    }

    const conversationReference = this.conversationReferences.get(chatId);
    
    if (!conversationReference) {
      const errorMsg = `No conversation reference found for chat ID ${chatId}. Cannot send message.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      await this.adapter.continueConversation(conversationReference, async (context: TurnContext) => {
        await context.sendActivity(message);
      });
      logger.info(`Sent Teams message to ${chatId}`);
    } catch (error) {
      logger.error(`Error sending Teams message to ${chatId}:`, error);
      throw error;
    }
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    this.adapter = null;
    logger.info('Teams adapter disconnected');
  }
}
