import { Telegraf, Context } from 'telegraf';
import { PlatformAdapter, Platform, Message } from '../types';
import { logger } from '../utils/logger';

/**
 * Telegram Platform Adapter using Telegraf
 */
export class TelegramAdapter implements PlatformAdapter {
  public readonly platform = Platform.TELEGRAM;
  private bot: Telegraf | null = null;
  private messageHandler?: (message: Message) => Promise<void>;

  constructor(private botToken: string) {}

  async initialize(): Promise<void> {
    this.bot = new Telegraf(this.botToken);

    this.bot.on('text', async (ctx: Context) => {
      if (this.messageHandler && ctx.message && 'text' in ctx.message) {
        const message: Message = {
          id: ctx.message.message_id.toString(),
          platform: Platform.TELEGRAM,
          userId: ctx.from?.id.toString() || 'unknown',
          userName: ctx.from?.username || ctx.from?.first_name,
          chatId: ctx.chat.id.toString(),
          text: ctx.message.text,
          timestamp: new Date(ctx.message.date * 1000),
          metadata: {
            chatType: ctx.chat.type,
            firstName: ctx.from?.first_name,
            lastName: ctx.from?.last_name,
          },
        };

        await this.messageHandler(message);
      }
    });

    await this.bot.launch();
    logger.info('Telegram adapter initialized');

    // Enable graceful stop
    process.once('SIGINT', () => this.disconnect());
    process.once('SIGTERM', () => this.disconnect());
  }

  async sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }

    await this.bot.telegram.sendMessage(chatId, message, {
      parse_mode: metadata?.parseMode || 'HTML',
    });
    logger.debug(`Sent Telegram message to ${chatId}`);
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
      this.bot = null;
      logger.info('Telegram adapter disconnected');
    }
  }
}
