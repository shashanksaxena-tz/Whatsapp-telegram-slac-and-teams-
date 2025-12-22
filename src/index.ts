import { config } from './utils/config';
import { logger } from './utils/logger';
import { MessageRouter } from './core/message-router';
import { MCPClientImpl } from './core/mcp-client';
import { createAIProvider } from './ai';
import {
  WhatsAppAdapter,
  TelegramAdapter,
  SlackAdapter,
  TeamsAdapter,
} from './platforms';
import { APIServer } from './api';

/**
 * Main application entry point
 */
async function main() {
  try {
    logger.info('Starting Multi-Platform AI Integration System...');

    // Initialize AI Provider
    logger.info(`Initializing AI provider: ${config.aiProvider}`);
    const aiProvider = createAIProvider();

    // Initialize MCP Client (optional)
    let mcpClient: MCPClientImpl | null = null;
    if (config.mcp.enabled && config.mcp.serverUrl) {
      logger.info(`Connecting to MCP server at ${config.mcp.serverUrl}`);
      mcpClient = new MCPClientImpl(config.mcp.timeout);
      await mcpClient.connect(config.mcp.serverUrl);
    } else {
      logger.info('MCP server disabled, using simulated actions');
    }

    // Initialize Message Router
    const router = new MessageRouter(aiProvider, mcpClient);

    // Initialize Platform Adapters
    const adapters: any[] = [];

    if (config.whatsapp.enabled) {
      logger.info('Initializing WhatsApp adapter...');
      const whatsappAdapter = new WhatsAppAdapter();
      adapters.push(whatsappAdapter);
      router.registerAdapter(whatsappAdapter);
      await whatsappAdapter.initialize();
    }

    if (config.telegram.enabled && config.telegram.botToken) {
      logger.info('Initializing Telegram adapter...');
      const telegramAdapter = new TelegramAdapter(config.telegram.botToken);
      adapters.push(telegramAdapter);
      router.registerAdapter(telegramAdapter);
      await telegramAdapter.initialize();
    }

    if (config.slack.enabled && config.slack.botToken && config.slack.signingSecret) {
      logger.info('Initializing Slack adapter...');
      const slackAdapter = new SlackAdapter(
        config.slack.botToken,
        config.slack.signingSecret,
        config.slack.appToken
      );
      adapters.push(slackAdapter);
      router.registerAdapter(slackAdapter);
      await slackAdapter.initialize();
    }

    if (config.teams.enabled && config.teams.appId && config.teams.appPassword) {
      logger.info('Initializing Teams adapter...');
      const teamsAdapter = new TeamsAdapter(config.teams.appId, config.teams.appPassword);
      adapters.push(teamsAdapter);
      router.registerAdapter(teamsAdapter);
      await teamsAdapter.initialize();

      // Teams needs an endpoint setup with the API server
      const apiServer = new APIServer(router, mcpClient);
      teamsAdapter.setupEndpoint(apiServer.getApp());
      apiServer.start(config.port);
    } else {
      // Start API server without Teams
      const apiServer = new APIServer(router, mcpClient);
      apiServer.start(config.port);
    }

    logger.info('System initialized successfully!');
    logger.info(`API server running on port ${config.port}`);
    logger.info('Enabled platforms:', adapters.map(a => a.platform).join(', '));

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await router.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error: any) {
    logger.error('Failed to start system:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
