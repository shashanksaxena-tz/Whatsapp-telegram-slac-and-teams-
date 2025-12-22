import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { PlatformAdapter, Platform, Message } from '../types';
import { logger } from '../utils/logger';

/**
 * WhatsApp Platform Adapter using whatsapp-web.js
 */
export class WhatsAppAdapter implements PlatformAdapter {
  public readonly platform = Platform.WHATSAPP;
  private client: Client | null = null;
  private messageHandler?: (message: Message) => Promise<void>;

  async initialize(): Promise<void> {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', (qr) => {
      logger.info('WhatsApp QR Code received. Scan with your phone:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      logger.info('WhatsApp client is ready!');
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated');
    });

    this.client.on('message', async (msg) => {
      if (this.messageHandler && !msg.fromMe) {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        
        const message: Message = {
          id: msg.id.id,
          platform: Platform.WHATSAPP,
          userId: contact.id.user,
          userName: contact.pushname || contact.name,
          chatId: chat.id._serialized,
          text: msg.body,
          timestamp: new Date(msg.timestamp * 1000),
          metadata: {
            isGroup: chat.isGroup,
            chatName: chat.name,
          },
        };

        await this.messageHandler(message);
      }
    });

    await this.client.initialize();
    logger.info('WhatsApp adapter initialized');
  }

  async sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.client) {
      throw new Error('WhatsApp client not initialized');
    }

    await this.client.sendMessage(chatId, message);
    logger.debug(`Sent WhatsApp message to ${chatId}`);
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      logger.info('WhatsApp adapter disconnected');
    }
  }
}
