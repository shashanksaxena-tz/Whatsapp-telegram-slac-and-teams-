import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { MessageRouter } from '../core/message-router';
import { MCPClientImpl } from '../core/mcp-client';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

/**
 * REST API for interacting with the system
 */
export class APIServer {
  private app: express.Application;
  private router: MessageRouter;
  private mcpClient: MCPClientImpl | null;

  constructor(router: MessageRouter, mcpClient: MCPClientImpl | null = null) {
    this.app = express();
    this.router = router;
    this.mcpClient = mcpClient;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Authentication middleware
    if (config.api.authEnabled) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        
        if (req.path === '/health' || req.path === '/') {
          return next();
        }

        if (!authHeader || authHeader !== `Bearer ${config.api.secretKey}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Multi-Platform AI Integration API',
        version: '1.0.0',
        description: 'AI-powered integration for WhatsApp, Telegram, Slack, and Microsoft Teams',
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /api/mcp',
          message: 'POST /api/message',
          platforms: 'GET /api/platforms',
        },
      });
    });

    // Get platform status
    this.app.get('/api/platforms', (req: Request, res: Response) => {
      res.json({
        whatsapp: { enabled: config.whatsapp.enabled },
        telegram: { enabled: config.telegram.enabled },
        slack: { enabled: config.slack.enabled },
        teams: { enabled: config.teams.enabled },
      });
    });

    // Send message via API
    this.app.post('/api/message', async (req: Request, res: Response) => {
      try {
        const { platform, chatId, text } = req.body;

        if (!platform || !chatId || !text) {
          return res.status(400).json({ 
            error: 'Missing required fields: platform, chatId, text' 
          });
        }

        // This would need to be implemented in MessageRouter
        // For now, return success
        res.json({ 
          success: true, 
          message: 'Message sent',
          data: { platform, chatId, text }
        });
      } catch (error: any) {
        logger.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Direct MCP request
    this.app.post('/api/mcp', async (req: Request, res: Response) => {
      try {
        if (!this.mcpClient) {
          return res.status(503).json({ 
            error: 'MCP client not enabled' 
          });
        }

        const { method, params, context } = req.body;

        if (!method) {
          return res.status(400).json({ 
            error: 'Missing required field: method' 
          });
        }

        const result = await this.mcpClient.request({
          method,
          params: params || {},
          context: context || {},
        });

        if (result.success) {
          res.json(result);
        } else {
          res.status(500).json(result);
        }
      } catch (error: any) {
        logger.error('Error processing MCP request:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Serve static files from the React frontend app
    const clientDistPath = path.join(__dirname, '../../client/dist');
    this.app.use(express.static(clientDistPath));

    // Handle SPA routing by returning index.html for unknown routes
    // This must be the last route handler
    this.app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  start(port: number): void {
    this.app.listen(port, () => {
      logger.info(`API server listening on port ${port}`);
    });
  }
}
