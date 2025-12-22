import { App } from '@slack/bolt';
import { PlatformAdapter, Platform, Message } from '../types';
import { logger } from '../utils/logger';

/**
 * Slack Platform Adapter using Bolt for JavaScript
 */
export class SlackAdapter implements PlatformAdapter {
  public readonly platform = Platform.SLACK;
  private app: App | null = null;
  private messageHandler?: (message: Message) => Promise<void>;

  constructor(
    private botToken: string,
    private signingSecret: string,
    private appToken?: string
  ) {}

  async initialize(): Promise<void> {
    this.app = new App({
      token: this.botToken,
      signingSecret: this.signingSecret,
      socketMode: !!this.appToken,
      appToken: this.appToken,
    });

    this.app.message(async ({ message, say }) => {
      if (this.messageHandler && 'text' in message && message.text) {
        const msg: Message = {
          id: message.ts,
          platform: Platform.SLACK,
          userId: message.user || 'unknown',
          chatId: message.channel,
          text: message.text,
          timestamp: new Date(parseFloat(message.ts) * 1000),
          metadata: {
            channelType: 'channel_type' in message ? message.channel_type : 'unknown',
            threadTs: 'thread_ts' in message ? message.thread_ts : undefined,
          },
        };

        await this.messageHandler(msg);
      }
    });

    if (this.appToken) {
      await this.app.start();
    } else {
      await this.app.start(3000);
    }
    logger.info('Slack adapter initialized');
  }

  async sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.app) {
      throw new Error('Slack app not initialized');
    }

    await this.app.client.chat.postMessage({
      channel: chatId,
      text: message,
      thread_ts: metadata?.threadTs,
    });
    logger.debug(`Sent Slack message to ${chatId}`);
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    if (this.app) {
      await this.app.stop();
      this.app = null;
      logger.info('Slack adapter disconnected');
    }
  }
}
